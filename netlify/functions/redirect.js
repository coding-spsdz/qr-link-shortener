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
        console.log('Event:', JSON.stringify(event, null, 2));

        if (!shortCode || shortCode.length < 3) {
            console.log('Invalid short code length');
            return {
                statusCode: 404,
                body: 'Short code not valid'
            };
        }

        // البحث في قاعدة البيانات
        const { data: link, error } = await supabase
            .from('links')
            .select('*')
            .eq('short_code', shortCode)
            .single();

        if (error) {
            console.log('Database error:', error);
            return {
                statusCode: 404,
                body: Link not found: ${error.message}
            };
        }

        if (!link) {
            console.log('No link found for code:', shortCode);
            return {
                statusCode: 404,
                body: 'Link not found'
            };
        }

        console.log('Found link:', link);

        // تحديث عدد الزيارات
        const { error: updateError } = await supabase
            .from('links')
            .update({ 
                visit_count: (link.visit_count || 0) + 1 
            })
            .eq('id', link.id);

        if (updateError) {
            console.log('Error updating visit count:', updateError);
        }

        // إعادة التوجيه
        return {
            statusCode: 301,
            headers: {
                'Location': link.destination_url
            }
        };

    } catch (error) {
        console.error('Redirect function error:', error);
        return {
            statusCode: 500,
            body: Server error: ${error.message}
        };
    }
};