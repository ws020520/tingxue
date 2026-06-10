export function svgCover(title = '归棠', theme = 0){
  const themes=[['#e9f3e6','#5f8d63','#243f32'],['#e7f0ec','#6b9870','#234437'],['#edf4e8','#86aa79','#2f593c'],['#f1f7ed','#7ca681','#244d33'],['#e9f5ef','#5f9273','#294438']]
  const t=themes[Math.abs(theme)%themes.length]
  const short=String(title||'归棠').slice(0,4).split('').join('\\A')
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200" viewBox="0 0 800 1200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${t[0]}"/><stop offset="1" stop-color="#fbfff6"/></linearGradient><filter id="b"><feGaussianBlur stdDeviation="18"/></filter></defs><rect width="800" height="1200" fill="url(#g)"/><g opacity=".42" filter="url(#b)"><path d="M-80 870C120 650 260 690 410 570c170-136 250-246 500-188v818H-80Z" fill="${t[1]}"/><path d="M-40 980c160-110 265-100 410-180 180-98 255-160 520-120v520H-40Z" fill="${t[2]}" opacity=".45"/></g><g fill="none" stroke="${t[2]}" stroke-width="3" opacity=".18"><path d="M95 260c80-80 160-100 245-70 88 32 168 17 250-58"/><path d="M120 930c120-85 230-80 345-25 90 43 176 32 260-30"/></g><text x="400" y="455" text-anchor="middle" fill="${t[2]}" font-family="serif" font-size="82" font-weight="800" style="white-space:pre">${escapeXml(short)}</text><text x="400" y="1030" text-anchor="middle" fill="${t[2]}" font-family="serif" font-size="30" opacity=".7">归棠</text></svg>`
  return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)
}
function escapeXml(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[m]))}
export function avatarFallback(){
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#4a853e"/><stop offset="1" stop-color="#154f23"/></linearGradient></defs><rect width="200" height="200" rx="46" fill="url(#g)"/><text x="100" y="128" text-anchor="middle" font-size="86" font-weight="900" fill="#fff" font-family="serif">棠</text></svg>`
  return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)
}
