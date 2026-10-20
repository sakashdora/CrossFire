import React from 'react';

export class AppErrorBoundary extends React.Component<{children:React.ReactNode},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){
    if(this.state.failed)return <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6"><section className="max-w-md"><h1 className="text-2xl font-bold">This page could not be opened</h1><p className="my-4 text-slate-300">Reload the page to try again. If you were saving a change, review your account before submitting it again.</p><button className="rounded-xl bg-orange-500 px-5 py-3 font-bold" onClick={()=>window.location.reload()}>Reload CrossFire</button></section></main>;
    return this.props.children;
  }
}
