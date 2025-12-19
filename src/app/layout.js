// ↓これが重要です！
import './globals.css'

export const metadata = {
  title: 'SF6 CONDITION ARCHIVE',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
      </head>
      <body>{children}</body>
    </html>
  )
}