const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
    try {
        const shortCode = event.path.split('/').pop();
        
        if (!shortCode || shortCode.length < 3) {
            return {
                statusCode: 302,
                headers: { 'Location': '/activate' }
            };
        }

        const { data: links } = await supabase
            .from('links')
            .select('*')
            .eq('short_code', shortCode);

        if (!links || links.length === 0) {
            return {
                statusCode: 302,
                headers: { 'Location': '/activate' }
            };
        }

        const link = links[0];

        await supabase
            .from('links')
            .update({ visit_count: (link.visit_count || 0) + 1 })
            .eq('id', link.id);

        return {
            statusCode: 301,
            headers: { 'Location': link.destination_url }
        };

    } catch (error) {
        return {
            statusCode: 302,
            headers: { 'Location': '/activate' }
        };
    }
};