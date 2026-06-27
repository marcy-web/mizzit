const { createClient } = require('@supabase/supabase-js')

const db = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'method not allowed !!' }
    }

    const { username, session_token, image_url, caption } = JSON.parse(event.body)

    if (!username || !session_token || !image_url) {
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

    // token checks out, insert the post
    const { error } = await db
        .from('posts')
        .insert({ username, image_url, caption })

    if (error) {
        return { statusCode: 500, body: JSON.stringify({ message: error.message, code: error.code }) }
    }

    return { statusCode: 200, body: 'posted !!' }
}