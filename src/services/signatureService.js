const SUPABASE_URL = 'https://ljdihkfmazskfthdbici.supabase.co';
const SUPABASE_KEY = 'sb_publishable_VCvu1tmWOJvpMsul5e3hng_jCcT8xV0';

const HEADERS = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
};

const genWriteKey = () => {
    const arr = new Uint8Array(20);
    crypto.getRandomValues(arr);
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
};

export const getOrCreateSig = async () => {
    let sigId   = localStorage.getItem('ovalue_sig_id');
    let writeKey = localStorage.getItem('ovalue_sig_write_key');
    if (sigId && writeKey) return { sigId, writeKey };

    writeKey = genWriteKey();
    const res = await fetch(`${SUPABASE_URL}/rest/v1/signatures`, {
        method: 'POST',
        headers: { ...HEADERS, 'Prefer': 'return=representation' },
        body: JSON.stringify({ write_key: writeKey, data: {}, bg_index: 0 }),
    });
    if (!res.ok) throw new Error(`Supabase insert failed: ${res.status}`);
    const [row] = await res.json();
    sigId = row.id;
    localStorage.setItem('ovalue_sig_id',        sigId);
    localStorage.setItem('ovalue_sig_write_key', writeKey);
    return { sigId, writeKey };
};

export const syncSignature = async (sigId, writeKey, data, bgIndex) => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/update_signature`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({
            p_id:       sigId,
            p_write_key: writeKey,
            p_data:     data,
            p_bg_index: bgIndex,
        }),
    });
    return res.ok;
};

export const resetSig = () => {
    localStorage.removeItem('ovalue_sig_id');
    localStorage.removeItem('ovalue_sig_write_key');
};
