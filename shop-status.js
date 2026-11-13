(function () {
  var URL_ = 'https://ynqnyuidxpjfcvcgexoi.supabase.co';
  var KEY_ = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlucW55dWlkeHBqZmN2Y2dleG9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNTUyMDAsImV4cCI6MjEwNTkzMTIwMH0.SRsgeU3_JSm-INcEYC-p5OzbwVoxZHWHFzaZnwa5UjY';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function fmt(t) {
    var p = String(t).split(':');
    var h = parseInt(p[0], 10);
    var m = p[1];
    var ap = h >= 12 ? 'م' : 'ص';
    h = h % 12 || 12;
    return h + (m && m !== '00' ? ':' + m : '') + ' ' + ap;
  }

  ready(function () {
    if (!window.supabase) return;
    var db = window.supabase.createClient(URL_, KEY_);
    var closed = false;

    var banner = document.createElement('div');
    banner.style.cssText = 'display:none;background:#fff7ed;border:1px solid #fdba74;color:#9a3412;border-radius:10px;padding:12px;margin:0 0 14px;text-align:center;font-size:15px;line-height:1.7;font-weight:bold;';

    function isStaffEntry(e) {
      if (e.tagName === 'A') return true;
      return /مهندس|الأدمن|SIS/i.test(e.textContent || '');
    }

    function targets() {
      var list = [];
      var forms = document.querySelectorAll('form');
      forms.forEach(function (f) {
        f.querySelectorAll('input,button,select,textarea').forEach(function (e) {
          if (!isStaffEntry(e)) list.push(e);
        });
      });
      if (!list.length) {
        document.querySelectorAll('input[type=text],input[type=tel],input:not([type])').forEach(function (e) { list.push(e); });
        document.querySelectorAll('button').forEach(function (b) {
          if (/احجز|حجز/.test(b.textContent || '') && !isStaffEntry(b)) list.push(b);
        });
      }
      return list;
    }

    function place() {
      if (banner.parentNode) return;
      var anchor = document.querySelector('form') || targets()[0];
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(banner, anchor);
    }

    function apply(state) {
      closed = !!state.closed;
      place();
      banner.style.display = closed ? 'block' : 'none';
      if (closed) banner.textContent = state.msg;
      targets().forEach(function (e) {
        e.disabled = closed;
        e.style.opacity = closed ? '0.5' : '';
      });
    }

    function check() {
      db.rpc('shop_status').then(function (r) {
        if (r.error || !r.data) return;
        var s = r.data;
        if (s.open) { apply({ closed: false }); return; }
        var msg = 'إحنا مقفولين دلوقتي 🙏';
        if (s.reason === 'closed_day') msg = 'النهاردة الصالون مقفول (أجازة). نتشرف بيك في يوم تاني 🙏';
        else if (s.reason === 'hours' && s.opens && s.closes) msg = 'إحنا مقفولين دلوقتي. مواعيدنا النهاردة من ' + fmt(s.opens) + ' لـ ' + fmt(s.closes) + ' 🙏';
        apply({ closed: true, msg: msg });
      }).catch(function () {});
    }

    document.addEventListener('submit', function (e) {
      if (closed) { e.preventDefault(); e.stopImmediatePropagation(); }
    }, true);
    document.addEventListener('click', function (e) {
      if (!closed) return;
      var b = e.target && e.target.closest ? e.target.closest('button') : null;
      if (b && /احجز|حجز/.test(b.textContent || '') && !isStaffEntry(b)) {
        e.preventDefault(); e.stopImmediatePropagation();
      }
    }, true);

    check();
    setInterval(check, 60000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) check(); });
  });
})();
