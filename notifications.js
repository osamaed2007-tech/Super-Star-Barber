(function () {
  const logoutBtn = document.getElementById('logoutBtn');
  if (!logoutBtn || typeof supabaseClient === 'undefined') return;

  const style = document.createElement('style');
  style.textContent = `
    .nb-wrap { display: flex; align-items: center; gap: 10px; }
    .nb-bell { position: relative; background: #0d1b2a; color: white; border: none; width: 38px; height: 34px; border-radius: 8px; font-size: 17px; cursor: pointer; }
    .nb-badge { position: absolute; top: -6px; right: -6px; background: #dc2626; color: white; font-size: 11px; min-width: 18px; height: 18px; line-height: 18px; border-radius: 9px; padding: 0 4px; }
    .nb-panel { position: fixed; top: 70px; left: 5vw; right: 5vw; max-width: 340px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 6px 24px rgba(0,0,0,0.25); z-index: 9999; max-height: 65vh; overflow-y: auto; }
    .nb-title { padding: 12px 15px; font-weight: bold; color: #0d1b2a; border-bottom: 1px solid #eee; }
    .nb-item { padding: 10px 15px; border-bottom: 1px solid #f3f3f3; font-size: 14px; color: #333; }
    .nb-item small { display: block; color: #999; font-size: 11px; margin-top: 3px; }
    .nb-unread { background: #eff6ff; }
    .nb-empty { padding: 20px; text-align: center; color: #999; font-size: 13px; }
  `;
  document.head.appendChild(style);

  const wrap = document.createElement('div');
  wrap.className = 'nb-wrap';
  logoutBtn.parentNode.insertBefore(wrap, logoutBtn);

  const bell = document.createElement('button');
  bell.className = 'nb-bell';
  bell.textContent = '🔔';
  const badge = document.createElement('span');
  badge.className = 'nb-badge';
  badge.style.display = 'none';
  bell.appendChild(badge);

  wrap.appendChild(bell);
  wrap.appendChild(logoutBtn);

  const panel = document.createElement('div');
  panel.className = 'nb-panel';
  panel.style.display = 'none';
  const title = document.createElement('div');
  title.className = 'nb-title';
  title.textContent = 'الإشعارات';
  const list = document.createElement('div');
  panel.appendChild(title);
  panel.appendChild(list);
  document.body.appendChild(panel);

  const icons = { booking: '🆕', cancelled: '❌', done: '✂️', staff: '👤' };
  let unread = 0;

  function setBadge(n) {
    unread = n;
    badge.textContent = n > 99 ? '99+' : n;
    badge.style.display = n > 0 ? 'block' : 'none';
  }

  function showEmpty() {
    list.innerHTML = '';
    const e = document.createElement('div');
    e.className = 'nb-empty';
    e.textContent = 'مفيش إشعارات لسه';
    list.appendChild(e);
  }

  function addItem(n, atTop) {
    const empty = list.querySelector('.nb-empty');
    if (empty) empty.remove();
    const item = document.createElement('div');
    item.className = 'nb-item' + (n.is_read ? '' : ' nb-unread');
    const msg = document.createElement('div');
    msg.textContent = (icons[n.type] || '🔔') + ' ' + n.message;
    const time = document.createElement('small');
    time.textContent = new Date(n.created_at).toLocaleString('ar-EG', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
    item.appendChild(msg);
    item.appendChild(time);
    if (atTop) list.prepend(item); else list.appendChild(item);
  }

  async function markAllRead() {
    await supabaseClient.from('notifications').update({ is_read: true }).eq('is_read', false);
    setBadge(0);
  }

  function closePanel() {
    panel.style.display = 'none';
    list.querySelectorAll('.nb-unread').forEach(el => el.classList.remove('nb-unread'));
  }

  bell.addEventListener('click', (e) => {
    e.stopPropagation();
    if (panel.style.display === 'none') {
      panel.style.display = 'block';
      if (unread > 0) markAllRead();
    } else {
      closePanel();
    }
  });

  document.addEventListener('click', (e) => {
    if (panel.style.display !== 'none' && !panel.contains(e.target)) closePanel();
  });

  async function init() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;

    const { data } = await supabaseClient
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (!data || data.length === 0) showEmpty();
    else data.forEach(n => addItem(n, false));

    const { count } = await supabaseClient
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);
    setBadge(count || 0);

    supabaseClient
      .channel('notifications-live')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          addItem(payload.new, true);
          if (panel.style.display === 'none') {
            setBadge(unread + 1);
            if (navigator.vibrate) navigator.vibrate(200);
          } else {
            markAllRead();
          }
        })
      .subscribe();
  }

  init();
})();
