const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
    try {
        const shortCode = event.path.split('/').pop();
        
        if (shortCode.length < 3) {
            return {
                statusCode: 302,
                headers: { 'Location': '/activate' }
            };
        }

        const { data, error } = await supabase
            .from('links')
            .select('id, destination_url, visit_count')
            .eq('short_code', shortCode)
            .limit(1);

        if (error) {
            return {
                statusCode: 302,
                headers: { 'Location': '/activate' }
            };
        }

        if (data.length === 0) {
            return {
                statusCode: 302,
                headers: { 'Location': '/activate' }
            };
        }

        const link = data[0];

        try {
            await supabase
                .from('links')
                .update({ visit_count: link.visit_count + 1 })
                .eq('id', link.id);
        } catch (updateError) {
            console.log('Update failed');
        }

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