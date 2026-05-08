'use client'
import { useState, useRef, useEffect } from 'react'
import { Camera, Trash2, X, ZoomIn } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Photo { id: string; url: string; caption: string | null; created_at: string }

// Canvas APIで画像を圧縮（最大1280px / JPEG 80%）
async function compressImage(file: File): Promise<Blob> {
  const MAX_PX = 1280
  const QUALITY = 0.80
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > MAX_PX || height > MAX_PX) {
        if (width >= height) { height = Math.round(height * MAX_PX / width); width = MAX_PX }
        else { width = Math.round(width * MAX_PX / height); height = MAX_PX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('compress failed')), 'image/jpeg', QUALITY)
    }
    img.onerror = reject
    img.src = url
  })
}

export default function FieldPhotoUpload({ fieldId }: { fieldId: string }) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string>('')
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/field-photos?field_id=${fieldId}`)
      .then(r => r.json())
      .then(data => setPhotos(Array.isArray(data) ? data : []))
  }, [fieldId])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    try {
      // 圧縮
      setUploadProgress('圧縮中...')
      const compressed = await compressImage(file)
      const sizeMB = (compressed.size / 1024 / 1024).toFixed(1)

      // アップロード
      setUploadProgress(`アップロード中 (${sizeMB}MB)...`)
      const supabase = createClient()
      const path = `${fieldId}/${Date.now()}.jpg`

      const { error: upErr } = await supabase.storage
        .from('field-photos')
        .upload(path, compressed, { contentType: 'image/jpeg', upsert: false })

      if (upErr) { alert('アップロード失敗: ' + upErr.message); return }

      const { data: { publicUrl } } = supabase.storage.from('field-photos').getPublicUrl(path)

      const res = await fetch('/api/field-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field_id: fieldId, url: publicUrl, caption: null }),
      })
      if (res.ok) {
        const saved: Photo = await res.json()
        setPhotos(prev => [saved, ...prev])
      }
    } catch (err) {
      alert('エラーが発生しました: ' + String(err))
    } finally {
      setUploading(false)
      setUploadProgress('')
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('この写真を削除しますか？')) return
    await fetch(`/api/field-photos?id=${id}`, { method: 'DELETE' })
    setPhotos(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleUpload} />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 hover:border-green-400 rounded-xl text-sm text-gray-500 hover:text-green-600 transition-colors disabled:opacity-50 w-full justify-center"
        >
          <Camera size={16} />
          {uploading ? uploadProgress || 'アップロード中...' : '写真を追加（自動圧縮）'}
        </button>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map(p => (
            <div key={p.id} className="relative aspect-square group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt="田んぼ写真"
                className="w-full h-full object-cover rounded-lg cursor-pointer"
                onClick={() => setPreview(p.url)}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                <button onClick={() => setPreview(p.url)} className="p-1.5 bg-white/90 rounded-full text-gray-700 hover:text-green-600">
                  <ZoomIn size={13} />
                </button>
                <button onClick={() => handleDelete(p.id)} className="p-1.5 bg-white/90 rounded-full text-gray-700 hover:text-red-500">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <button className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full">
            <X size={24} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="プレビュー" className="max-w-full max-h-full object-contain rounded-lg" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}
