import{supabase}from"./supabase";

export async function getCurrentUser(){
 if(!supabase)return null;
 const{data}=await supabase.auth.getUser();
 return data.user??null;
}

export async function sendMagicLink(email:string){
 if(!supabase)throw new Error("Backend is nog niet geconfigureerd.");
 const{error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:window.location.origin}});
 if(error)throw error;
}

export async function signInWithProvider(provider:"google"|"apple"){
 if(!supabase)throw new Error("Backend is nog niet geconfigureerd.");
 const{error}=await supabase.auth.signInWithOAuth({provider,options:{redirectTo:window.location.origin}});
 if(error)throw error;
}

export async function signOut(){
 if(!supabase)return;
 const{error}=await supabase.auth.signOut();
 if(error)throw error;
}
