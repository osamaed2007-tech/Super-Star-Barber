(function () {
  if (typeof supabaseClient === 'undefined') return;
  const header = document.querySelector('.header');
  if (!header) return;

  const style = document.createElement('style');
  style.textContent = `
    .mc-box { background: white; border-radius: 10px; padding: 15px; margin-bottom: 20px; box-shadow: 0 1px 5px rgba(0,0,0,0.08); }
    .mc-box h3 { margin: 0 0 10px; color: #0d1b2a; font-size: 15px; }
    .mc-row { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; }
    .mc-btn { color: white; border: none; padding: 9px 14px; border-radius: 6px; font-size: 14px; cursor: pointer; }
    .mc-btn:disabled { opacity: 0.6; }
    .mc-input { width: 100%; padding: 9px; border: 1px solid #ccc; border-radius: 6px; box-sizing: border-box; text-align: right; margin: 8px 0; }
    .mc-hr { border: none; border-top: 1px solid #eee; margin: 15px 0; }
    .mc-msg { font-size: 13px; font-weight: bold; margin: 6px 0 0; }
  `;
  document.head.appendChild(style);

  const box = document.createElement('div');
  box.className = 'mc-box';
  box.innerHTML = `
    <h3>وضع التحديث</h3>
    <div class="mc-row">
      <span id="mcStatus" style="font-size:14px;">جاري التحميل...</span>
      <button class="mc-btn" id="mcToggle" disabled>...</button>
    </div>
    <hr class="mc-hr">
    <h3>إرسال تنبيه للموظفين</h3>
    <input class="mc-input" id="mcText" maxlength="200" placeholder="مثال: تم تحديث نظام الحجز">
    <button class="mc-btn" id="mcSend" style="background:#0d1b2a;width:100%;">إرسال</button>
    <p class="mc-msg" id="mcMsg"></p>
  `;
  header.parentNode.insertBefore(box, header.nextSibling);

  const statusEl = document.getElementById('mcStatus');
  const toggleBtn = document.getElementById('mcToggle');
  const textEl = document.getElementById('mcText');
  const sendBtn = document.getElementById('mcSend');
  const msgEl = document.getElementById('mcMsg');
  let state = 'off';

  function render() {
    const on = state === 'on';
    statusEl.textContent = on ? 'مفعّل: الموقع واقف للعملاء' : 'مقفول: الموقع شغال طبيعي';
    statusEl.style.color = on ? '#dc2626' : '#16a34a';
    toggleBtn.textContent = on ? 'إيقاف وضع التحديث' : 'تشغيل وضع التحديث';
    toggleBtn.style.background = on ? '#16a34a' : '#dc2626';
    toggleBtn.disabled = false;
  }

  async function load() {
    const { data } = await supabaseClient
      .from('site_settings').select('value').eq('key', 'maintenance').single();
    if (data) state = data.value;
    render();
  }

  toggleBtn.addEventListener('click', async () => {
    const next = state === 'on' ? 'off' : 'on';
    const q = next === 'on'
      ? 'الموقع هيقف على كل العملاء. متأكد؟'
      : 'الموقع هيرجع يشتغل للعملاء. متأكد؟';
    if (!confirm(q)) return;
    toggleBtn.disabled = true;
    const { data, error } = await supabaseClient
      .from('site_settings').update({ value: next }).eq('key', 'maintenance').select();
    if (error || !data || data.length === 0) {
      alert('ما اتغيرش، اتأكد إنك مسجل دخول كمهندس');
      toggleBtn.disabled = false;
      return;
    }
    state = next;
    render();
  });

  sendBtn.addEventListener('click', async () => {
    const text = textEl.value.trim();
    if (!text) return;
    sendBtn.disabled = true;
    const { error } = await supabaseClient
      .from('notifications').insert([{ type: 'announce', message: text }]);
    if (error) {
      msgEl.style.color = 'red';
      msgEl.textContent = 'حصل خطأ، جرب تاني';
    } else {
      msgEl.style.color = 'green';
      msgEl.textContent = 'تم الإرسال';
      textEl.value = '';
    }
    sendBtn.disabled = false;
  });

  load();
})();
