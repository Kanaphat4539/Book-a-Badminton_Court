async function fillWhenHydrated(page,userSelector,user,passwordSelector,password,{timeout=30000,stableMs=500,pollMs=50}={}) {
  const userInput=page.locator(userSelector), passwordInput=page.locator(passwordSelector);
  await userInput.waitFor({state:'visible',timeout});
  await passwordInput.waitFor({state:'visible',timeout});
  await page.waitForFunction(([u,p])=>{const a=document.querySelector(u),b=document.querySelector(p);return a&&!a.disabled&&b&&!b.disabled},[userSelector,passwordSelector],{timeout});
  const deadline=Date.now()+timeout;
  while(Date.now()<deadline){
    await userInput.fill(user);
    await passwordInput.fill(password);
    const stable=await page.waitForFunction(([u,p,expectedUser,expectedPassword,interval])=>{
      const a=document.querySelector(u),b=document.querySelector(p);
      const key='__qaLoginStableSince';
      if(!a||!b||a.value!==expectedUser||b.value!==expectedPassword){delete window[key];return false;}
      const signature=expectedUser.length+':'+expectedUser+expectedPassword;
      if(window[key]?.signature!==signature)window[key]={signature,since:performance.now()};
      return performance.now()-window[key].since>=interval;
    },[userSelector,passwordSelector,user,password,stableMs],{timeout:Math.min(timeout,stableMs+1000),polling:pollMs}).catch(()=>null);
    if(stable)return;
  }
  throw new Error('Login inputs did not remain stable after repeated fill; hydration did not settle');
}
module.exports={fillWhenHydrated};
