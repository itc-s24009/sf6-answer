'use client';

import { useState, useEffect } from 'react';

const charaFilenames = [
  'a.k.i..png', 'dhalsim.png', 'jamie.png', 'lily.png', 'sagat.png',
  'blanka.png', 'e.honda.png', 'jp.png', 'luke.png', 'terry.png',
  'c.viper.png', 'ed.png', 'juri.png', 'mai.png', 'vega.png',
  'cammy.png', 'elena.png', 'ken.png', 'manon.png', 'zangief.png',
  'chun-li.png', 'gouki.png', 'kimberly.png', 'marisa.png',
  'dee jay.png', 'guile.png', 'rashid.png', 'ryu.png'
];

export default function Home() {
  const [archiveData, setArchiveData] = useState([]);
  const [activeCondition, setActiveCondition] = useState({ id: 'all', text: 'すべてのキャラクター' });
  const [modalType, setModalType] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [mounted, setMounted] = useState(false); // Hydration Error対策用

  const [formText, setFormText] = useState('');
  const [isInverseEnabled, setIsInverseEnabled] = useState(false);
  const [inverseText, setInverseText] = useState('');
  const [pickingSet, setPickingSet] = useState(new Set());

  // コンポーネントがブラウザに表示されてから動作を開始させる
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('sf6_archive');
    if (saved) setArchiveData(JSON.parse(saved));
  }, []);

  if (!mounted) return <div style={{background:'#000', height:'100vh'}} />; // 読み込み中は空にする

  const saveArchive = (newData) => {
    setArchiveData(newData);
    localStorage.setItem('sf6_archive', JSON.stringify(newData));
  };

  const handleSave = () => {
    if (!formText || pickingSet.size === 0) return alert("文言とキャラを選択してください");
    let newData = [...archiveData];

    if (editingItem) {
      const idx = newData.findIndex(a => a.id === editingItem.id);
      newData[idx] = { id: editingItem.id, text: formText, charas: Array.from(pickingSet) };
    } else {
      const mid = 'D' + Date.now();
      newData.push({ id: mid, text: formText, charas: Array.from(pickingSet) });
      if (isInverseEnabled && inverseText) {
        const invC = charaFilenames.filter(f => !pickingSet.has(f));
        if (invC.length > 0) {
          newData.push({ id: 'I' + Date.now(), text: inverseText, charas: invC });
        }
      }
    }
    saveArchive(newData);
    setModalType(null);
  };

  return (
    <div className="wrapper">
      <header className="main-header">
        <div className="logo">ANSWERS <span className="version">NEXT.JS</span></div>
        <div className="btn-group">
          <button className="header-btn select-mode" onClick={() => setModalType('select')}>
            <span className="material-symbols-outlined">segment</span>条件を選ぶ
          </button>
          <button className="header-btn add-mode" onClick={() => { setEditingItem(null); setFormText(''); setPickingSet(new Set()); setModalType('form'); }}>
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>
      </header>

      <div className="condition-billboard">
        <div className="billboard-inner">
          <label>RESULT FOR:</label>
          <h1 id="activeCondition">{activeCondition.text}</h1>
        </div>
      </div>

      <main className="gallery-container">
        <div className="character-grid">
          {charaFilenames.map(file => (
            <div 
              key={file} 
              className={`card ${activeCondition.id !== 'all' && activeCondition.charas?.includes(file) ? 'matched' : ''}`}
            >
              <img src={`/sf6/${file}`} alt="" />
            </div>
          ))}
        </div>
      </main>

      {/* ポップアップ：アーカイブ */}
      {modalType === 'select' && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-top">
              <h2>ARCHIVE</h2>
              <button className="modal-close" onClick={() => setModalType(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="archive-list">
              <button className="archive-main-btn" onClick={() => { setActiveCondition({id: 'all', text: 'すべてのキャラクター'}); setModalType(null); }}>
                全キャラクターを表示
              </button>
              {archiveData.map(item => (
                <div key={item.id} className="archive-btn-wrap">
                  <button className="archive-main-btn" onClick={() => { setActiveCondition(item); setModalType(null); }}>
                    {item.text}
                  </button>
                  <button className="edit-mini-btn" onClick={() => { setEditingItem(item); setFormText(item.text); setPickingSet(new Set(item.charas)); setModalType('form'); }}>編集</button>
                  <button className="del-mini-btn" onClick={() => { if(confirm('消去しますか？')) saveArchive(archiveData.filter(a=>a.id!==item.id)); }}>消去</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ポップアップ：作成・編集 */}
      {modalType === 'form' && (
        <div className="modal-overlay">
          <div className="modal-box large">
            <div className="modal-top">
              <h2>{editingItem ? 'EDIT' : 'CREATE'}</h2>
              <button className="modal-close" onClick={() => setModalType(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="edit-layout">
              <div className="edit-left">
                <textarea value={formText} onChange={e=>setFormText(e.target.value)} placeholder="条件内容を入力..." />
                {!editingItem && (
                  <div className="inverse-option-area">
                    <label style={{cursor:'pointer'}}>
                      <input type="checkbox" checked={isInverseEnabled} onChange={e=>setIsInverseEnabled(e.target.checked)} /> 「反対」も同時に作成
                    </label>
                    {isInverseEnabled && <textarea value={inverseText} onChange={e=>setInverseText(e.target.value)} placeholder="反対の条件文..." style={{marginTop:10}}/>}
                  </div>
                )}
                <button className="confirm-btn" onClick={handleSave}>保存して完了</button>
              </div>
              <div className="edit-right">
                <div className="mini-chara-grid">
                  {charaFilenames.map(f => (
                    <div key={f} className={`mini-card ${pickingSet.has(f) ? 'active' : ''}`} onClick={()=>{const n=new Set(pickingSet); n.has(f)?n.delete(f):n.add(f); setPickingSet(n);}}>
                      <img src={`/sf6/${f}`} alt="" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}