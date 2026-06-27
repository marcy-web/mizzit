const { createClient } = require('@supabase/supabase-js')

const db = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'method not allowed !!' }
    }

    const { username, session_token, action, post_id } = JSON.parse(event.body)

    if (!username || !session_token || !action) {
        return { statusCode: 400, body: 'missing required fields !!' }
    }

    // verify session token
    const { data: user, error: userError } = await db
        .from('users')
        .select('session_token')
        .eq('username', username)
        .single()

    if (userError || !user || user.session_token !== session_token) {
        return { statusCode: 401, body: 'nice try !!' }
    }

    // delete a single post
    if (action === 'delete_post') {
        if (!post_id) return { statusCode: 400, body: 'missing post id !!' }

        const { error } = await db
            .from('posts')
            .delete()
            .eq('id', post_id)
            .eq('username', username) // safety check!!

        if (error) return { statusCode: 500, body: 'something went wrong :(' }
        return { statusCode: 200, body: 'deleted !!' }
    }

    // delete entire account
    if (action === 'delete_account') {
        // delete all their posts first
        await db.from('posts').delete().eq('username', username)
        // delete the user
        await db.from('users').delete().eq('username', username)

        return { statusCode: 200, body: 'account deleted !!' }
    }

    return { statusCode: 400, body: 'unknown action !!' }
}
