/**
 * アプリケーションのエントリーポイント
 * ReactアプリケーションをDOMにマウントする
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Reactアプリケーションをルート要素にレンダリング
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
