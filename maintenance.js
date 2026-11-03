(function () {
  if (typeof supabaseClient === 'undefined') return;

  function showScreen() {
    if (document.getElementById('mnt-screen')) return;
    const s = document.createElement('div');
    s.id = 'mnt-screen';
    s.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;background:linear-gradient(160deg,#0d1b2a,#1b2838);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:20px;color:white;font-family:Arial,sans-serif;direction:rtl;';

    const img = document.createElement('img');
    img.src = 'logo.png';
    img.style.cssText = 'width:140px;height:140px;border-radius:50%;box-shadow:0 4px 20px rgba(0,0,0,0.4);margin-bottom:25px;';

    const h = document.createElement('h2');
    h.textContent = 'الموقع خاضع لتحديثات';
    h.style.cssText = 'margin:0 0 10px;font-size:22px;';

    const p = document.createElement('p');
    p.textContent = 'يرجى الانتظار';
    p.style.cssText = 'margin:0 0 30px;font-size:16px;color:#cbd5e1;';

    const name = document.createElement('div');
    name.textContent = 'Osama A Badran';
    name.style.cssText = 'font-size:13px;color:#8b95a5;direction:ltr;';

    s.appendChild(img);
    s.appendChild(h);
    s.appendChild(p);
    s.appendChild(name);
    document.body.appendChild(s);
    document.body.style.overflow = 'hidden';
  }

  async function isEngineer() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return false;
    const { data } = await supabaseClient
      .from('staff').select('role').eq('email', session.user.email).single();
    return !!data && data.role === 'engineer';
  }

  async function check() {
    const { data, error } = await supabaseClient
      .from('site_settings').select('value').eq('key', 'maintenance').single();
    if (error || !data) return;
    if (data.value === 'on' && !(await isEngineer())) showScreen();
  }

  check();

  supabaseClient
    .channel('maintenance-live')
    .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'site_settings' },
      (payload) => {
        if (payload.new.value === 'on') check();
        else if (document.getElementById('mnt-screen')) location.reload();
      })
    .subscribe();
})();
