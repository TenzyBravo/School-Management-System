import React, { useState } from 'react'
import { apiFetch } from '../lib/api'

interface BulkUploadResult {
  message: string
  created: number
  errors: number
  skipped: number
  details: {
    created: any[]
    errors: any[]
    skipped: any[]
  }
}

interface Props {
  type: 'students' | 'users'
  onClose: () => void
  onSuccess: () => void
}

export default function BulkUploadModal({ type, onClose, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<BulkUploadResult | null>(null)

  const endpoint = type === 'students' ? '/api/v1/students' : '/api/v1/users'
  const title = type === 'students' ? 'Students' : 'Faculty/Staff'

  async function handleUpload() {
    if (!file) return

    setUploading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await apiFetch(`${endpoint}/bulk_upload/`, {
        method: 'POST',
        body: formData,
        headers: {} // Let browser set Content-Type with boundary
      })

      const data = await res.json()

      if (res.ok) {
        setResult(data)
        if (data.created > 0) {
          setTimeout(() => {
            onSuccess()
            if (data.errors === 0 && data.skipped === 0) {
              onClose()
            }
          }, 2000)
        }
      } else {
        alert(`Upload failed: ${data.error || data.detail || JSON.stringify(data)}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  async function downloadTemplate() {
    try {
      const res = await apiFetch(`${endpoint}/download_template/`)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}_template.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download template error:', error)
      alert('Failed to download template')
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1F2937', margin: 0 }}>
            Bulk Upload {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6B7280',
              padding: '0',
              width: '32px',
              height: '32px'
            }}
          >
            ×
          </button>
        </div>

        {/* Instructions */}
        <div style={{
          background: '#EEF2FF',
          border: '1px solid #C7D2FE',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#4F46E5', marginTop: 0, marginBottom: '8px' }}>
            📋 Instructions:
          </h4>
          <ol style={{ fontSize: '14px', color: '#6366F1', margin: 0, paddingLeft: '20px' }}>
            <li>Download the CSV template below</li>
            <li>Fill in your {type} data (don't change column headers)</li>
            <li>Upload the completed CSV or Excel file</li>
            <li>Review the upload results</li>
          </ol>
        </div>

        {/* Template Download */}
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={downloadTemplate}
            style={{
              background: '#10B981',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              width: '100%'
            }}
          >
            📥 Download Template CSV
          </button>
        </div>

        {/* File Upload */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '8px'
          }}>
            Select File (CSV or Excel)
          </label>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px dashed #D1D5DB',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box',
              cursor: 'pointer'
            }}
          />
          {file && (
            <div style={{ marginTop: '8px', fontSize: '14px', color: '#6B7280' }}>
              Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </div>
          )}
        </div>

        {/* Upload Result */}
        {result && (
          <div style={{
            background: result.created > 0 ? '#DCFCE7' : '#FEE2E2',
            border: `1px solid ${result.created > 0 ? '#86EFAC' : '#FCA5A5'}`,
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <h4 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: result.created > 0 ? '#15803D' : '#991B1B',
              marginTop: 0,
              marginBottom: '12px'
            }}>
              {result.message}
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#059669', marginBottom: '4px' }}>Created</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#047857' }}>{result.created}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#DC2626', marginBottom: '4px' }}>Errors</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#991B1B' }}>{result.errors}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#F59E0B', marginBottom: '4px' }}>Skipped</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#D97706' }}>{result.skipped}</div>
              </div>
            </div>

            {/* Show errors if any */}
            {result.details.errors.length > 0 && (
              <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                <h5 style={{ fontSize: '14px', fontWeight: '600', color: '#991B1B', marginTop: 0, marginBottom: '8px' }}>
                  Errors:
                </h5>
                {result.details.errors.map((err, idx) => (
                  <div key={idx} style={{ fontSize: '13px', color: '#7F1D1D', marginBottom: '4px' }}>
                    Row {err.row}: {err.error}
                  </div>
                ))}
              </div>
            )}

            {/* Show skipped if any */}
            {result.details.skipped.length > 0 && (
              <div style={{ maxHeight: '200px', overflow: 'auto', marginTop: '12px' }}>
                <h5 style={{ fontSize: '14px', fontWeight: '600', color: '#D97706', marginTop: 0, marginBottom: '8px' }}>
                  Skipped (already exists):
                </h5>
                {result.details.skipped.map((skip, idx) => (
                  <div key={idx} style={{ fontSize: '13px', color: '#92400E', marginBottom: '4px' }}>
                    Row {skip.row}: {skip.reason}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            style={{
              background: (!file || uploading) ? '#D1D5DB' : '#4F46E5',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: (!file || uploading) ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              flex: 1
            }}
          >
            {uploading ? '⏳ Uploading...' : '📤 Upload File'}
          </button>
          <button
            onClick={onClose}
            style={{
              background: '#F3F4F6',
              color: '#374151',
              border: '1px solid #D1D5DB',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
