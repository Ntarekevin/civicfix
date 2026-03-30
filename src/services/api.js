import { auth } from '@/utils/firebase';
import { signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

// --- Helpers from backend/routes/reports.js ---
const generateToken = () => {
    const array = new Uint8Array(12);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

const generatePublicId = () => {
    const digits = Math.floor(100000 + Math.random() * 900000);
    return `CP-${digits}`;
};

// --- Cache Wrapper for PWA Offline Functionality ---
const withCache = async (cacheKey, fetcher) => {
    if (typeof window !== 'undefined' && navigator.onLine) {
        try {
            const data = await fetcher();
            localStorage.setItem(`civicfix_cache_${cacheKey}`, JSON.stringify(data));
            return data;
        } catch (error) {
            const cached = localStorage.getItem(`civicfix_cache_${cacheKey}`);
            if (cached) return JSON.parse(cached);
            throw error;
        }
    } else if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(`civicfix_cache_${cacheKey}`);
        if (cached) return JSON.parse(cached);
    }
    // Final fallback (e.g. server-side or if offline with no cache logic catch)
    return await fetcher();
};

// -------- Public Endpoints --------

export const getPublicReports = async (params = {}) => {
    return withCache(`reports_${params.category || 'all'}_${params.limit || 100}_${params.offset || 0}`, async () => {
        const { category, limit = 100, offset = 0 } = params;

    let query = supabase
        .from('reports')
        .select(`
            id, public_id, category, status, description, created_at,
            locations(latitude, longitude, city, address),
            media(file_url, file_type),
            report_likes(count),
            report_comments(*)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (category) {
        // Search in category column OR as a hashtag in description
        query = query.or(`category.ilike.${category},description.ilike.%#${category}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

        // Format like the backend response
        const reports = data.map(r => ({
            ...r,
            lat: r.locations?.latitude,
            lng: r.locations?.longitude,
            city: r.locations?.city,
            media: r.media.map(m => ({ url: m.file_url, type: m.file_type })),
            stars: r.report_likes?.length || 0,
            comments: r.report_comments || []
        }));

        // Get stats
        const { data: stats } = await supabase.rpc('get_category_stats'); // Need to add this RPC or just manual count

        return { reports, stats: stats || [], total: reports.length };
    });
};

export const trackReport = async (input) => {
    return withCache(`track_${input}`, async () => {
        if (!input) throw new Error('Input is required');
        
        // Normalize input: strip # and make uppercase
        const cleanedId = input.trim().replace(/^#/, '').toUpperCase();
        
        // Multi-faceted search for robustness
        const searchTerms = [cleanedId];
        if (!cleanedId.startsWith('CP-') && /^\d+$/.test(cleanedId)) {
            searchTerms.push(`CP-${cleanedId}`);
        }

        const { data, error } = await supabase
            .from('reports')
            .select(`*, locations(*), media(*), report_comments(*)`)
            .or(`public_id.ilike.${searchTerms.join(',public_id.ilike.')},tracking_token.eq.${cleanedId}`)
            .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error('404: Report not found');
        
        return data;
    });
};

export const submitReport = async (formData) => {
    // formData is usually a FormData object from the UI
    const category = formData.get('category');
    const description = formData.get('description');
    const latitude = formData.get('latitude');
    const longitude = formData.get('longitude');
    const address = formData.get('address');
    const city = formData.get('city');
    const files = formData.getAll('media');

    // 1. Create location
    let locationId = null;
    if (latitude && longitude) {
        const { data: loc, error: locErr } = await supabase
            .from('locations')
            .insert({
                address: address || null,
                city: city || null,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude)
            })
            .select()
            .single();
        if (locErr) throw locErr;
        locationId = loc.id;
    }

    // 2. Insert report
    const trackingToken = generateToken();
    const publicId = generatePublicId();

    const { data: report, error: repErr } = await supabase
        .from('reports')
        .insert({
            category,
            description: description || null,
            location_id: locationId,
            tracking_token: trackingToken,
            public_id: publicId,
            status: 'open'
        })
        .select()
        .single();
    
    if (repErr) throw repErr;

    // 3. Upload media
    if (files && files.length > 0) {
        for (const file of files) {
            const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
            const filePath = `reports/${report.id}/${fileName}`;
            
            const { error: uploadErr } = await supabase.storage
                .from('content')
                .upload(filePath, file);
            
            if (uploadErr) {
                console.error('Upload error:', uploadErr);
                continue;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('content')
                .getPublicUrl(filePath);

            await supabase
                .from('media')
                .insert({
                    report_id: report.id,
                    file_url: publicUrl,
                    file_type: file.type
                });
        }
    }

    // Handle mentions and notifications (background-ish)
    if (description) {
        const mentionMatches = description.match(/[@#]([\w._-]+)/g) || [];
        const uniqueMentions = [...new Set(mentionMatches)];
        console.log(`[Mention Debug] Found tags:`, uniqueMentions);
        
        for (const m of uniqueMentions) {
            try {
                const searchTerm = m.slice(1).toLowerCase();
                if (!searchTerm || searchTerm.length < 2) continue;

                // Robust Search: check username exactly OR full_name like it
                const { data: profiles, error: searchErr } = await supabase
                    .from('profiles')
                    .select('id, username, full_name, role')
                    .or(`username.ilike.${searchTerm},full_name.ilike.%${searchTerm}%`);
                
                if (searchErr) throw searchErr;
                console.log(`[Mention Debug] Profiles found for "${searchTerm}":`, profiles?.length);

                if (profiles && profiles.length > 0) {
                    // Precedence: 1. Exact username, 2. First fuzzy match
                    const bestMatch = profiles.find(p => p.username?.toLowerCase() === searchTerm) || profiles[0];
                    const targetId = bestMatch.id;
                    console.log(`[Mention Debug] Notifying user ID: ${targetId} (${bestMatch.username})`);

                    // Record Mention
                    await supabase.from('report_mentions').upsert({
                        report_id: report.id,
                        authority_id: targetId
                    }, { onConflict: 'report_id,authority_id' });

                    // Insert Notification
                    await supabase.from('notifications').insert({
                        type: 'mention',
                        content: `New report #${publicId} mentioned you!`,
                        report_id: report.id,
                        target_user_id: targetId
                    });
                }
            } catch (mentionErr) {
                console.error('[Mention Debug] Error:', mentionErr);
            }
        }
    }

    return {
        msg: 'Report submitted successfully',
        reportId: report.id,
        trackingToken: report.tracking_token,
        publicId: report.public_id,
        submittedAt: report.created_at
    };
};

export const starReport = async (id) => {
    // Note: IP address tracking in client-side Supabase is tricky without Edge Functions.
    // For now, we'll just record the like.
    const { error } = await supabase
        .from('report_likes')
        .insert({ report_id: id });
    
    if (error && error.code !== '23505') throw error; // Ignore unique constraint violation

    const { count } = await supabase
        .from('report_likes')
        .select('*', { count: 'exact', head: true })
        .eq('report_id', id);

    return { stars: count };
};

export const commentReport = async (id, content, authorName) => {
    const { data: user } = await supabase.auth.getUser();
    const userId = user?.user?.id;
    
    // Get profile for role/name if logged in
    let finalAuthorName = authorName || 'Anonymous';
    let authorRole = null;

    if (userId) {
        const { data: profile } = await supabase.from('profiles').select('full_name, username, role').eq('id', userId).single();
        if (profile) {
            finalAuthorName = profile.full_name || profile.username;
            authorRole = profile.role;
        }
    }

    const { data: comment, error } = await supabase
        .from('report_comments')
        .insert({
            report_id: id,
            content,
            author_name: finalAuthorName,
            author_id: userId || null,
            author_role: authorRole
        })
        .select()
        .single();

    if (error) throw error;

    // 1. Notify the original reporter (via tracking token)
    const { data: report } = await supabase.from('reports').select('tracking_token, public_id').eq('id', id).single();
    if (report) {
        await supabase.from('notifications').insert({
            type: 'reply',
            content: `New comment on report ${report.public_id}: "${content.substring(0, 30)}..."`,
            target_token: report.tracking_token,
            report_id: id
        });
    }

    // 2. Notify all authorities mentioned in this thread (Thread Reply)
    try {
        const { data: mentions } = await supabase.from('report_mentions').select('authority_id').eq('report_id', id);
        if (mentions && mentions.length > 0) {
            const alertedUserIds = new Set();
            for (const m of mentions) {
                if (m.authority_id === userId) continue; // Don't notify self
                if (alertedUserIds.has(m.authority_id)) continue;
                
                await supabase.from('notifications').insert({
                    type: 'thread_reply',
                    content: `Someone replied to a thread that mentioned you (Report ${report?.public_id || id})`,
                    report_id: id,
                    target_user_id: m.authority_id
                });
                alertedUserIds.add(m.authority_id);
            }
        }
    } catch (threadErr) {
        console.error('[Thread Reply Debug] Error:', threadErr);
    }

    // 3. Handle mentions in this specific comment
    const mentionMatches = content.match(/[@#]([\w._-]+)/g) || [];
    const uniqueMentions = [...new Set(mentionMatches)];
    console.log(`[Comment Mention Debug] Tags:`, uniqueMentions);

    for (const m of uniqueMentions) {
        try {
            const searchTerm = m.slice(1).toLowerCase();
            if (!searchTerm || searchTerm.length < 2) continue;

            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, username')
                .or(`username.ilike.${searchTerm},full_name.ilike.%${searchTerm}%`);

            if (profiles && profiles.length > 0) {
                const bestMatch = profiles.find(p => p.username?.toLowerCase() === searchTerm) || profiles[0];
                const targetId = bestMatch.id;
                console.log(`[Comment Mention Debug] Notifying ${targetId}`);

                await supabase.from('notifications').insert({
                    type: 'mention',
                    content: `${finalAuthorName} tagged you in a comment on report ${report?.public_id || id}`,
                    report_id: id,
                    target_user_id: targetId
                });
            }
        } catch (mentionErr) {
            console.error('[Comment Mention Debug] Error:', mentionErr);
        }
    }

    return comment;
};

export const getNotifications = async (params = {}) => {
    const { tokens } = params; // Comma-separated tokens
    let query = supabase.from('notifications').select('*').is('target_user_id', null);

    if (tokens) {
        const tokenList = tokens.split(',').map(t => t.trim());
        query = supabase.from('notifications').select('*').or(`target_token.in.(${tokenList.join(',')}),target_user_id.is.null`);
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(20);
    if (error) throw error;
    return data;
};

export const getAuthorityNotifications = async () => {
    const userProfile = JSON.parse(localStorage.getItem('civifix_user') || 'null');
    if (!userProfile?.id) return [];

    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('target_user_id', userProfile.id)
        .order('created_at', { ascending: false })
        .limit(50);
    
    if (error) throw error;
    return data;
};

export const markNotificationAsRead = async (id) => {
    const { error } = await supabase
        .from('notifications')
        .update({ is_unread: false })
        .eq('id', id);
    if (error) throw error;
    return { msg: 'Notification marked as read' };
};

export const markAllNotificationsAsRead = async (tokens) => {
    const { error } = await supabase
        .from('notifications')
        .update({ is_unread: false })
        .in('target_token', tokens);
    if (error) throw error;
    return { msg: 'All notifications marked as read' };
};

export const markAllAuthorityNotificationsAsRead = async () => {
    const userProfile = JSON.parse(localStorage.getItem('civifix_user') || 'null');
    if (!userProfile?.id) return;

    const { error } = await supabase
        .from('notifications')
        .update({ is_unread: false })
        .eq('target_user_id', userProfile.id);
    if (error) throw error;
};

export const getTrends = async () => {
    return withCache('trends', async () => {
        try {
            // 1. Try SQL RPC first (most efficient)
            const { data: rpcData, error: rpcError } = await supabase.rpc('get_category_stats');
            if (!rpcError && rpcData && rpcData.length > 0) return rpcData;

            // 2. Fallback: Client-side aggregation of recent reports
            const { data: reports, error: reportsError } = await supabase
                .from('reports')
                .select('description, category')
                .order('created_at', { ascending: false })
                .limit(100);

            if (reportsError || !reports) return [];

            const counts = {};
            reports.forEach(r => {
                // Include explicit category
                if (r.category) {
                    const cat = r.category.toLowerCase().replace('#', '').trim();
                    if (cat) counts[cat] = (counts[cat] || 0) + 1;
                }
                // Extract all #hashtags from description
                const tags = r.description?.match(/#\w+/g) || [];
                tags.forEach(t => {
                    const tag = t.toLowerCase().replace('#', '').trim();
                    if (tag) counts[tag] = (counts[tag] || 0) + 1;
                });
            });

            return Object.entries(counts)
                .map(([tag, count]) => ({ tag, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);
        } catch (err) {
            console.error('getTrends error:', err);
            return [];
        }
    });
};

export const getReportComments = async (id) => {
    const { data, error } = await supabase
        .from('report_comments')
        .select('id, content, author_name, author_id, author_role, created_at')
        .eq('report_id', id)
        .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
};

export const escalateReport = async (id) => {
    const { error } = await supabase
        .from('reports')
        .update({ status: 'escalated', updated_at: new Date().toISOString() })
        .eq('id', id);
    if (error) throw error;

    // Notify first admin
    const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1);
    if (admins && admins.length > 0) {
        const { data: report } = await supabase.from('reports').select('public_id').eq('id', id).single();
        await supabase.from('notifications').insert({
            type: 'alert',
            content: `Report ${report?.public_id || id} has been escalated!`,
            target_user_id: admins[0].id,
            report_id: id
        });
    }
};

// -------- Auth Endpoints --------

export const login = async (email, password) => {
    // Firebase Login
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    
    // Get profile from Supabase
    const { data: profile, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('firebase_uid', userCredential.user.uid)
        .maybeSingle();
    
    if (profErr) throw profErr;
    if (!profile) throw new Error('Account created in Firebase but no profile found in Supabase. Please contact admin or try registering again.');

    localStorage.setItem('civifix_auth_token', token);
    localStorage.setItem('civifix_user', JSON.stringify(profile));
    
    return { token, user: profile };
};

export const register = async (email, username, password, fullName, role) => {
    // Firebase Register
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: fullName });
    const token = await userCredential.user.getIdToken();

    // Create profile in Supabase
    const { data: profile, error } = await supabase
        .from('profiles')
        .insert({
            firebase_uid: userCredential.user.uid,
            username: username || (email.split('@')[0] + Math.floor(Math.random() * 1000)),
            full_name: fullName,
            role: role || 'official'
        })
        .select()
        .maybeSingle();
    
    if (error) throw error;
    if (!profile) throw new Error('Registration succeeded but profile could not be retrieved. Please try logging in.');

    localStorage.setItem('civifix_auth_token', token);
    localStorage.setItem('civifix_user', JSON.stringify(profile));

    return { token, user: profile };
};

export const logout = async () => {
    try {
        await Promise.all([
            signOut(auth),
            supabase.auth.signOut()
        ]);
    } catch (err) {
        console.error('Logout error:', err);
    }
    localStorage.removeItem('civifix_auth_token');
    localStorage.removeItem('civifix_user');
};

export const updateReport = async (token, data) => {
    const { description, category } = data;
    const { data: report, error } = await supabase
        .from('reports')
        .update({
            description: description || undefined,
            category: category || undefined,
            updated_at: new Date().toISOString()
        })
        .eq('tracking_token', token)
        .select()
        .single();
    
    if (error) throw error;
    return report;
};

// -------- Authority Endpoints --------

export const getAdminReports = async () => {
    return withCache('admin_reports', async () => {
        const userProfile = JSON.parse(localStorage.getItem('civifix_user') || 'null');
        if (!userProfile?.id) throw new Error('Unauthorized');

        let query = supabase
            .from('reports')
            .select(`
                id, public_id, description, category, status, created_at, assigned_to,
                locations(latitude, longitude, address, city),
                profiles!reports_assigned_to_fkey(username),
                media(file_url, file_type)
            `)
            .order('created_at', { ascending: false });

        if (userProfile.role !== 'admin') {
            // Filter by mentions
            const { data: mentions } = await supabase.from('report_mentions').select('report_id').eq('authority_id', userProfile.id);
            const reportIds = mentions.map(m => m.report_id);
            query = query.in('id', reportIds);
        }

        const { data, error } = await query;
        if (error) throw error;

        return data.map(r => ({
            ...r,
            lat: r.locations?.latitude,
            lng: r.locations?.longitude,
            address: r.locations?.address,
            city: r.locations?.city,
            assigned_to_username: r.profiles?.username,
            media: r.media.map(m => ({ url: m.file_url, type: m.file_type })),
            is_mentioned: true
        }));
    });
};

export const getReportDetail = async (id) => {
    return withCache(`report_${id}`, async () => {
        const { data: report, error: repErr } = await supabase
            .from('reports')
            .select('*, locations(*), profiles!reports_assigned_to_fkey(username)')
            .eq('id', id)
            .single();
        
        if (repErr) throw repErr;

        const { data: media } = await supabase.from('media').select('*').eq('report_id', id);
        // Note: status history and audit log are not yet fully implemented in Supabase schema but could be added.
        
        return {
            report: {
                ...report,
                lat: report.locations?.latitude,
                lng: report.locations?.longitude,
                address: report.locations?.address,
                city: report.locations?.city,
                assigned_to_username: report.profiles?.username
            },
            media: media || [],
            history: [] // Placeholder
        };
    });
};

export const updateReportStatus = async (id, status, notes) => {
    const userProfile = JSON.parse(localStorage.getItem('civifix_user') || 'null');
    
    const { data: original } = await supabase.from('reports').select('status, public_id, tracking_token').eq('id', id).single();
    const oldStatus = original?.status;

    const { error } = await supabase
        .from('reports')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
    
    if (error) throw error;

    // Notification for reporter
    if (original?.tracking_token) {
        await supabase.from('notifications').insert({
            type: 'status_change',
            content: `Report ${original.public_id} status updated to: ${status}`,
            target_token: original.tracking_token,
            report_id: id
        });
    }

    return { msg: 'Status updated successfully', reportId: id, newStatus: status };
};

export const assignReport = async (id, assignTo) => {
    const { error } = await supabase
        .from('reports')
        .update({ assigned_to: assignTo, updated_at: new Date().toISOString() })
        .eq('id', id);
    
    if (error) throw error;
    return { msg: 'Report assigned successfully' };
};

export const getUsers = async () => {
    return withCache('users', async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, role, full_name, created_at')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    });
};
