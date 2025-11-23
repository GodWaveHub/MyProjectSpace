/**
 * アプリケーションのルートコンポーネント
 * GISマップアプリケーションのエントリーポイント
 */
import './App.css'
import MapCanvas from './components/MapCanvas'

/**
 * Appコンポーネント
 * @returns アプリケーションのルート要素
 */
function App() {
  return (
    <div className="fullscreen-app">
      <MapCanvas />
    </div>
  )
}

export default App
