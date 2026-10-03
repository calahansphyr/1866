window.DCLogic = class {};
document.addEventListener('DOMContentLoaded', () => {
  const s = document.querySelector('script[type="text/x-dc"]');
  const Component = new Function(s.textContent + '; return Component;')();
  const vals = new Component().renderVals();
  const get = (ctx, path) => path.split('.').reduce((o, k) => o == null ? o : o[k], ctx);
  const fill = (str, ctx) => str.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, p) => { const v = get(ctx, p); return v == null ? '' : v; });
  function expand(root, ctx) {
    root.querySelectorAll(':scope sc-for').forEach(f => {
      if (!root.contains(f) || f.parentElement.closest('sc-for') && f.parentElement.closest('sc-for') !== f && root.contains(f.parentElement.closest('sc-for')) && f.parentElement.closest('sc-for') !== root) return;
    });
    let f;
    while ((f = root.querySelector('sc-for'))) {
      const list = get(ctx, f.getAttribute('list').replace(/[{}]/g, '').trim()) || [];
      const as = f.getAttribute('as');
      const tpl = f.innerHTML;
      const frag = document.createElement('div');
      list.forEach(item => {
        const c = Object.assign({}, ctx, { [as]: item });
        const d = document.createElement('div'); d.innerHTML = tpl;
        expand(d, c);
        d.innerHTML = fill(d.innerHTML, c);
        frag.append(...d.childNodes);
      });
      f.replaceWith(...frag.childNodes);
    }
  }
  const x = document.querySelector('x-dc');
  const h = x.querySelector('helmet'); if (h) { document.head.append(...h.childNodes); h.remove(); }
  expand(x, vals);
  x.innerHTML = fill(x.innerHTML, vals);
  document.body.dataset.ready = 1;
});
