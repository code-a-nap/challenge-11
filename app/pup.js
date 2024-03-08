const puppeteer = require("puppeteer");

async function login (url){
    const browser = await puppeteer.launch({args: ["--no-sandbox"], headless: "new"});
    const page = await browser.newPage();

    await page.setRequestInterception(true);

    page.on('request', interceptedRequest => {

        var data = {
            'method': 'POST',
            'postData': `email=admin@example.com&password=${process.env.ADMINPWD}`,
            headers: {
                ...interceptedRequest.headers(),
                "Content-Type": "application/x-www-form-urlencoded"
              }
        };
    
        // Request modified... finish sending! 
        interceptedRequest.continue(data);
    });

    await page.goto(url, {
        waitUntil: ["networkidle0", "domcontentloaded"],
      });
    
    await page.content();
    const cookie = await page.cookies();
    await browser.close();
    return cookie[0].value;
}


async function visitProfile (username, token) {

    const browser = await puppeteer.launch({args: ["--no-sandbox"], headless: "new"});
    const page = await browser.newPage();

    const cookie = {name: "connect.sid", value: token, domain: process.env.DOMAIN, secure: false, httpOnly: true};
    const hardFlag = {name: "HardFlag", value: process.env.HARDFLAG, domain: process.env.DOMAIN, secure: false, httpOnly: false};

    await page.setCookie(cookie, hardFlag);
    page.setJavaScriptEnabled(false);

    try {
        await page.goto('http://' + process.env.DOMAIN + "/profile-" + username, {
        waitUntil: ["networkidle0", "domcontentloaded"],
      });
    }
    catch(e){
        console.log(e);
        return;
    }
    
    
    const content = await page.content();
    
    const page2 = await browser.newPage();

    page2.setJavaScriptEnabled(true);
    try {
        await page2.goto('http://' + process.env.DOMAIN + "/sandbox?payload=" + encodeURIComponent(content), {
        waitUntil: ["networkidle0", "domcontentloaded"],
      });
    }
    catch(e){
        console.log(e);
        return;
    }

    await page2.content();
    await browser.close();
}


module.exports = { login, visitProfile};
