const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // تاريخ 6 أشهر مضت
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // حذف الروابط القديمة التي لم تستخدم
        const { data: deletedLinks, error } = await supabase
            .from('links')
            .delete()
            .lt('created_at', sixMonthsAgo.toISOString())
            .eq('visit_count', 0)
            .select();

        if (error) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Database error' })
            };
        }

        // تنظيف محاولات العملاء القديمة
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        await supabase
            .from('customer_attempts')
            .delete()
            .lt('reset_time', oneDayAgo.toISOString());

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true,
                deletedCount: deletedLinks ? deletedLinks.length : 0
            })
        };

    } catch (error) {
        console.error('Cleanup API Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};