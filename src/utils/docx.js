export async function extractDocxText(file){
  const buf = await file.arrayBuffer()
  const xmlBuf = await zipEntry(buf, 'word/document.xml')
  const xml = new TextDecoder('utf-8').decode(xmlBuf)
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
  let ps = Array.from(doc.getElementsByTagName('w:p'))
  if(!ps.length) ps = Array.from(doc.getElementsByTagNameNS(W, 'p'))
  if(!ps.length) ps = Array.from(doc.querySelectorAll('p,w\\:p'))
  if(!ps.length) throw new Error('DOCX 文件中未找到段落内容')
  const paras = []
  for(const p of ps){
    let ts = Array.from(p.getElementsByTagName('w:t'))
    if(!ts.length) ts = Array.from(p.getElementsByTagNameNS(W, 't'))
    const text = ts.map(t => t.textContent).join('')
    paras.push(text)
  }
  return paras.filter(Boolean).join('\n')
}

async function zipEntry(buffer,target){
  const dv=new DataView(buffer); const len=buffer.byteLength
  let eocd=-1
  for(let i=len-22;i>=Math.max(0,len-65558);i--){ if(dv.getUint32(i,true)===0x06054b50){eocd=i;break} }
  if(eocd<0) throw new Error('文件不是有效的 DOCX（可能是旧版 .doc）')
  const total=dv.getUint16(eocd+10,true), cdOff=dv.getUint32(eocd+16,true), cdSize=dv.getUint32(eocd+12,true)
  const td=new TextDecoder('utf-8')
  for(let off=cdOff;off<Math.min(cdOff+cdSize,len);){
    if(dv.getUint32(off,true)!==0x02014b50) break
    const method=dv.getUint16(off+10,true)
    const compSize=dv.getUint32(off+20,true)
    const nameLen=dv.getUint16(off+28,true), extraLen=dv.getUint16(off+30,true), commentLen=dv.getUint16(off+32,true)
    const localOff=dv.getUint32(off+42,true)
    const name=td.decode(new Uint8Array(buffer,off+46,nameLen))
    if(name===target){
      if(dv.getUint32(localOff,true)!==0x04034b50) throw new Error('DOCX 本地文件头异常')
      const ln=dv.getUint16(localOff+26,true), le=dv.getUint16(localOff+28,true)
      const dataOff=localOff+30+ln+le
      const comp=new Uint8Array(buffer,dataOff,compSize)
      if(method===0) return comp
      if(method===8){
        const ds=new DecompressionStream('deflate-raw')
        const stream=new Blob([comp]).stream().pipeThrough(ds)
        return new Uint8Array(await new Response(stream).arrayBuffer())
      }
      throw new Error('DOCX 压缩方式不受支持：'+method)
    }
    off += 46 + nameLen + extraLen + commentLen
  }
  throw new Error('DOCX 中未找到 word/document.xml')
}
