import prisma from '@/lib/prisma';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';

export default async function CharacterDetail({ params }) {
  const p = await params;
  const decodedFilename = decodeURIComponent(p.filename);

  // -------------------------------------------------------
  // 1. お気に入りを切り替える「サーバーアクション」
  // 引数で condId を直接受け取るように変更しました
  // -------------------------------------------------------
  async function toggleFavoriteAction(condId) {
    'use server';
    try {
      // データベースから既存の「お気に入り」を探す
      const existing = await prisma.favorite.findUnique({
        where: { 
            conditionId_charaName: { 
                conditionId: condId, 
                charaName: decodedFilename 
            } 
        }
      });

      if (existing) {
        // あれば消す
        await prisma.favorite.delete({ where: { id: existing.id } });
      } else {
        // なければ作る
        await prisma.favorite.create({
          data: { conditionId: condId, charaName: decodedFilename }
        });
      }
      
      // このページを更新（ソートを反映）
      revalidatePath(`/character/${p.filename}`);
    } catch (e) {
      console.error("Favorite toggle failed:", e);
    }
  }

  try {
    // 2. データの取得
    const [allMatching, myFavorites] = await Promise.all([
      prisma.condition.findMany({ where: { charas: { has: decodedFilename } } }),
      prisma.favorite.findMany({ where: { charaName: decodedFilename } })
    ]);

    // 3. お気に入り情報の統合とソート
    const favSet = new Set(myFavorites.map(f => f.conditionId));
    const sortedConditions = allMatching
      .map(c => ({ ...c, isFav: favSet.has(c.id) }))
      .sort((a, b) => {
        if (a.isFav === b.isFav) return 0;
        return a.isFav ? -1 : 1;
      });

    return (
      <div className="wrapper">
        <header className="main-header">
          <div className="logo">{decodedFilename.split('.')[0].toUpperCase()}</div>
          <Link href="/" className="header-btn select-mode" style={{ textDecoration: 'none' }}>
            <span className="material-symbols-outlined">arrow_back</span>
            戻る
          </Link>
        </header>

        <main style={{ padding: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {/* 左側：キャラ画像 */}
          <div className="card matched" style={{ width: '260px', height: '400px' }}>
            <img src={`/sf6/${decodedFilename}`} alt="" style={{ width: '100%', marginLeft: 0 }} />
          </div>

          {/* 右側：条件リスト */}
          <div style={{ flex: '1', minWidth: '300px', background: '#111', padding: '20px', border: '1px solid #333' }}>
            <h3 style={{ color: 'var(--accent)', borderBottom: '1px solid #333', paddingBottom: '15px' }}>
              MATCHING CONDITIONS
            </h3>
            <div className="archive-list" style={{ marginTop: '20px' }}>
              {sortedConditions.length > 0 ? (
                sortedConditions.map(item => (
                  <div key={item.id} className="archive-btn-wrap">
                    <div className={`archive-main-btn ${item.isFav ? 'fav-active' : ''}`} style={{ cursor: 'default', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{flex: 1, marginRight: '10px'}}>{item.text}</span>
                      
                      {/* お気に入り☆ボタン 
                          引数（item.id）を bind(null, ...) で渡す形に変更 */}
                      <form action={toggleFavoriteAction.bind(null, item.id)}>
                        <button type="submit" style={{ 
                            background:'none', border:'none', cursor:'pointer', fontSize:'24px', 
                            color: item.isFav ? 'var(--accent)' : '#444' 
                        }}>
                          {item.isFav ? '★' : '☆'}
                        </button>
                      </form>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: '#666' }}>条件がありません</p>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  } catch (error) {
    return <div style={{ padding: 40, color: 'red' }}>Error: {error.message}</div>;
  }
}