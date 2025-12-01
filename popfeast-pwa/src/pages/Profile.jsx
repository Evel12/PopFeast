import React from 'react';

export default function Profile() {
  return (
    <section className="section">
      <h2>Profile</h2>
      <div className="detail" style={{display:'grid',justifyItems:'center',gap:16}}>
        <div className="profile-avatar">
          <img src="/profile.png" alt="Profile" onError={(e)=>{e.currentTarget.src='/icons/logo.png';}} />
        </div>
        <div className="profile-info" style={{display:'grid',gap:8,fontWeight:700}}>
          <div>Nama: Jeremy Cavellino Sulistyo<span className="muted" style={{fontWeight:600}}></span></div>
          <div>NIM: 21120123140162<span className="muted" style={{fontWeight:600}}></span></div>
        </div>
      </div>
    </section>
  );
}