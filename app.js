const SUPABASE_URL = 'https://shwnnvthzqzluaarwstx.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_PelBXWZoTLsDoFBHgDsGpA_tS4kDdeI'

const { createClient } = supabase
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ---- auth ----

async function signup(username, password) {
    // check username isn't already taken
    const { data: existing } = await db
        .from('users')
        .select('username')
        .eq('username', username)
        .single()

    if (existing) return { error: 'username already taken !!' }

    // hash the password
    const hashed = await hashPassword(password)

    const { data, error } = await db
        .from('users')
        .insert({ username, password: hashed })
        .select()
        .single()

    if (error) return { error: error.message }

    // save session locally
    localStorage.setItem('user', JSON.stringify({ id: data.id, username: data.username }))
    return { data }
}

async function login(username, password) {
    const { data: user, error } = await db
        .from('users')
        .select('*')
        .eq('username', username)
        .single()

    if (error || !user) return { error: 'username not found !!' }

    const match = await verifyPassword(password, user.password)
    if (!match) return { error: 'wrong password !!' }

    localStorage.setItem('user', JSON.stringify({ id: user.id, username: user.username }))
    return { data: user }
}

function logout() {
    localStorage.removeItem('user')
    window.location.href = '/login.html'
}

function getUser() {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
}

// ---- password hashing ----
// using the Web Crypto API -- fuck libraries !!

async function hashPassword(password) {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const keyMaterial = await crypto.subtle.importKey(
        "raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]
    );
    const hash = await crypto.subtle.deriveBits(
        { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
        keyMaterial, 256
    );
    const hashArray = Array.from(new Uint8Array(hash));
    const saltArray = Array.from(salt);
    return btoa(JSON.stringify({ salt: saltArray, hash: hashArray }));
}

async function verifyPassword(password, stored) {
    const { salt, hash } = JSON.parse(atob(stored));
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]
    );
    const newHash = await crypto.subtle.deriveBits(
        { name: "PBKDF2", salt: new Uint8Array(salt), iterations: 100000, hash: "SHA-256" },
        keyMaterial, 256
    );
    const newHashArray = Array.from(new Uint8Array(newHash));
    return JSON.stringify(newHashArray) === JSON.stringify(hash);
}