const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
    try {
        // استخراج الكود من المسار
        const segments = event.path.split('/');
        const shortCode = segments[segments.length - 1];
        
        console.log('Processing redirect for code:', shortCode);
        console.log('Full path:', event.path);

        if (!shortCode  shortCode.length < 3  shortCode.length > 25) {
            console.log('Invalid short code length');
            return {
                statusCode: 302,
                headers: {
                    'Location': '/404.html'
                }
            };
        }

        // التحقق من صحة الكود (حروف وأرقام فقط)
        const validCodePattern = /^[a-zA-Z0-9]+$/;
        if (!validCodePattern.test(shortCode)) {
            console.log('Invalid short code format');
            return {
                statusCode: 302,
                headers: {
                    'Location': '/404.html'
                }
            };
        }

        // البحث في قاعدة البيانات
        const { data: links, error } = await supabase
            .from('links')
            .select('*')
            .eq('short_code', shortCode)
            .limit(1);

        if (error) {
            console.log('Database error:', error);
            return {
                statusCode: 302,
                headers: {
                    'Location': '/404.html?code=' + encodeURIComponent(shortCode)
                }
            };
        }

        if (!links || links.length === 0) {
            console.log('No link found for code:', shortCode);
            return {
                statusCode: 302,
                headers: {
                    'Location': '/404.html?code=' + encodeURIComponent(shortCode)
                }
            };
        }

        const link = links[0];
        console.log('Found link:', link.destination_url);

        // تحديث عدد الزيارات
        try {
            await supabase
                .from('links')
                .update({ 
                    visit_count: (link.visit_count || 0) + 1 
                })
                .eq('id', link.id);
        } catch (updateError) {
            console.log('Error updating visit count:', updateError);
            // لا نوقف العملية لأجل خطأ في التحديث
        }

        // إعادة التوجيه
        return {
            statusCode: 301,
            headers: {
                'Location': link.destination_url,
                'Cache-Control': 'no-cache'
            }
        };

    } catch (error) {
        console.error('Redirect function error:', error);
        return {
            statusCode: 302,
            headers: {
                'Location': '/404.html'
            }
        };
    }
};