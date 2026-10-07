import{supabase}from"./supabase";

export async function getCurrentUser(){
 if(!supabase)return null;
 const{data}=await supabase.auth.getUser();
 return data.user??null;
}

export async function sendMagicLink(email:string){
 if(!supabase)throw new Error("Backend is nog niet geconfigureerd.");
 return supabase.auth.signInWithOtp({email,options:{emailRedirectTo:window.location.origin}});
}

export async function signInWithProvider(provider:"google"|"apple"){
 if(!supabase)throw new Error("Backend is nog niet geconfigureerd.");
 return supabase.auth.signInWithOAuth({provider,options:{redirectTo:window.location.origin}});
}

export async function signOut(){
 if(supabase)await supabase.auth.signOut();
}
