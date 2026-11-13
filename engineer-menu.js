(function () {
  // كل صفحة جديدة = سطر جديد هنا
    var TOOLS = [
    { icon: '📥', title: 'صندوق الرسائل', href: 'inbox.html', badge: 'messages' },
    { icon: '👥', title: 'إدارة الحلاقين', href: 'barbers.html' },
    { icon: '📊', title: 'تقارير SIS', href: 'reports.html' },
    { icon: '🏷️', title: 'الأسعار والخدمات', href: 'prices.html' },
    { icon: '🕘', title: 'ساعات العمل', href: 'hours.html' }
  ];
  var style = document.createElement('style');
  style.textContent =
    '.em-box{background:white;border-radius:12px;padding:14px;margin:16px;box-shadow:0 1px 5px rgba(0,0,0,0.08)}' +
    '.em-box h3{margin:0 0 10px;color:#0d1b2a;font-size:16px}' +
    '.em-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}' +
    '.em-tile{position:relative;background:#0d1b2a;color:white;border:none;border-radius:10px;padding:16px 8px;font-size:14px;font-family:inherit;text-align:center}' +
    '.em-tile span{display:block;font-size:24px;margin-bottom:6px}' +
    '.em-badge{position:absolute;top:6px;left:6px;background:#dc2626;color:white;border-radius:10px;min-width:20px;padding:1px 6px;font-size:12px}';
  document.head.appendChild(style);

  var box = document.createElement('div');
  box.className = 'em-box';
  var h = document.createElement('h3');
  h.textContent = 'أدوات المهندس';
  box.appendChild(h);
  var grid = document.createElement('div');
  grid.className = 'em-grid';
  box.appendChild(grid);

  var badges = {};
  TOOLS.forEach(function (t) {
    var b = document.createElement('button');
    b.className = 'em-tile';
    var ic = document.createElement('span');
    ic.textContent = t.icon;
    b.appendChild(ic);
    b.appendChild(document.createTextNode(t.title));
    b.onclick = function () { location.href = t.href; };
    if (t.badge) {
      var bd = document.createElement('i');
      bd.className = 'em-badge';
      bd.style.display = 'none';
      bd.style.fontStyle = 'normal';
      b.appendChild(bd);
      badges[t.badge] = bd;
    }
    grid.appendChild(b);
  });

  var header = document.querySelector('.header');
  if (header && header.parentNode) header.parentNode.insertBefore(box, header.nextSibling);
  else document.body.insertBefore(box, document.body.firstChild);

  function refresh() {
    if (typeof supabaseClient === 'undefined' || !badges.messages) return;
    supabaseClient.from('messages').select('id', { count: 'exact', head: true }).eq('is_read', false)
      .then(function (r) {
        if (r.error) return;
        var n = r.count || 0;
        badges.messages.textContent = n;
        badges.messages.style.display = n > 0 ? 'inline-block' : 'none';
      });
  }
  refresh();
  setInterval(refresh, 15000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) refresh(); });
})();
