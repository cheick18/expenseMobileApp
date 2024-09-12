const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const axios = require('axios')
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const querystring = require('querystring');

const {   dbNode,addDoc,doc,collection,query,getDocs,where} = require('./firebaseConfig'); 




const app = express();
const port = 80;
app.use(cors()); 
const XLSX = require('xlsx');
app.use(bodyParser.json());
const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {

   user: process.env.SECRET_MAIL,
  pass:process.env.SECRET_PASS
  }
});
const clientid = process.env.GOOGLE_ID;
const clientsecret = process.env.GOOGLE_SECRET;
const redirecturi = 'https://expensemobileapp-2.onrender.com/signin-google';
const googleAuthUrl = 'https://accounts.google.com/o/oauth2/auth';
app.get('/download', (req, res) => {
  // Exemple de données JSON

  const encodedData = req.query.data;

    if (!encodedData) {
        return res.status(400).send('No data provided');
    }
    let datax;
    try {
        const jsonData = decodeURIComponent(encodedData);
        datax = JSON.parse(jsonData);
        console.log(datax)
    } catch (error) {
        return res.status(400).send('Invalid data format');
    }
  
 
  const ws = XLSX.utils.json_to_sheet(datax);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');


  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

  // Définir les en-têtes de réponse pour le téléchargement
  res.setHeader('Content-Disposition', 'attachment; filename=expenses.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

  res.send(wbout);
});




app.post('/Site', async (req, res) => {

    try {
    

        
      const { url, hook} = req.body; 
      const pattern = new RegExp('^(https?:\\/\\/)?'+ 
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ 
        '((\\d{1,3}\\.){3}\\d{1,3}))'+ 
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ 
        '(\\?[;&a-z\\d%_.~+=-]*)?'+ 
        '(\\#[-a-z\\d_]*)?$','i'); 
        //  const urlObj = new URL(url);
        // return url.trim() !== '' && ['http:', 'https:'].includes(urlObj.protocol);
      const isurl=!!pattern.test( url)
      const ishook=!!pattern.test( hook)
    

   
      if(!url||!hook){
        res.status(400).send('Please enter URLs before submitting.');
      }else
      {
        console.log("verification des url",isurl+"  "+ishook)
        if(isurl==false||ishook==false){
          res.status(400).send('The URLs you entered are not valid. Please check and try again.');

        }else{


      const q = query(collection(dbNode, 'MappingTable'), 
                  where('hook', '==', hook),
                  where('url', '==', url));


const querySnapshot = await getDocs(q);

if ( !querySnapshot.empty) {
  res.status(400).send('The URLs entered contain duplicates. Please ensure each URL is unique.')
  return; 
}else{


     
     
const saveUrl= await addDoc(collection(dbNode, "MappingTable"), {
    url,
    hook,
    timestamp: new Date()
    

});
  
res.status(200).send('Resource added successfully');
    }
  }
      
      

  }
    
    } catch (error) {
      console.error('Erreur lors de l\'ajout des données :', error);
      res.status(500).send('Erreur lors de l\'ajout des données');
    }
  });

  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });

  app.get('/Sites', async (req, res) => {
    try {
      const mappingTableRef = collection(dbNode, "MappingTable");


const querySnapshot = await getDocs(mappingTableRef);
     
      
      const data = [];
      querySnapshot.forEach(doc => {
        data.push({"id": doc.id, "data": doc.data()});
      });
      
      res.send(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des données :', error);
      res.status(500).send('Erreur lors de la récupération');
    }
  });
  function getJiraAuthUrl() {
    return `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${process.env.JIRA_ID}&scope=read%3Ame%20manage%3Ajira-project%20manage%3Ajira-configuration%20read%3Ajira-user%20write%3Ajira-work%20manage%3Ajira-webhook%20manage%3Ajira-data-provider%20read%3Ajira-work&redirect_uri=https%3A%2F%2Fexpensemobileapp-2.onrender.com%2Fsignin-jira&state=YOUR_USER_BOUND_VALUE&response_type=code&prompt=consent`

   return  `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${process.env.JIRA_ID}&scope=read%3Ame%20read%3Aaccount&redirect_uri=https%3A%2F%2Fexpensemobileapp-2.onrender.com%2Fsignin-jira&state=YOUR_USER_BOUND_VALUE&response_type=code&prompt=consent`;
   
   }




   async function exchangeJiraCodeForToken(code) {
    console.log("le code est ")


    try {
    
      const tokenResponse = await axios.post('https://auth.atlassian.com/oauth/token', {
        code,
       redirect_uri: 'https://expensemobileapp-2.onrender.com/signin-jira',
      client_id: process.env.JIRA_ID,
      client_secret: process.env.JIRA_SECRET,
        grant_type: 'authorization_code',
      });
  
      const accessToken = tokenResponse.data.access_token;
  
      const userDataResponse = await axios.get('https://api.atlassian.com/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (userDataResponse.status === 200) { 
        const userData = userDataResponse.data;
       // console.log("la reponse est", userData);
        return accessToken;
      } else {
        console.log("échec de récupération des données !");
      }
    } catch (error) {
      console.error('Erreur lors de l\'échange du code contre le token :', error.message);
      throw error;
    }
  }




  
    app.get('/signin-jira', async (req, res) => {
    try {
     
      if (req.query.code) {
        const code = req.query.code;
        const tokenResponse = await exchangeJiraCodeForToken(code);
      //  const accessToken = response.data.access_token;
      //  res.redirect(`com.waga.stickersmash:/oauthredirect?access_token=${tokenResponse}`);
       res.redirect(`stickersmash://?access_token=${tokenResponse}`);
        //stickersmash
      //  res.send(tokenResponse);
      } else {
     
        const authUrl =  getJiraAuthUrl();
        res.redirect(authUrl);
      }
    } catch (error) {
      console.error('Erreur lors de l\'échange du code contre le token :', error);
      res.status(500).send('Erreur lors de l\'échange du code contre le token');
    }
  });

  /***** */
  app.get('/signin-google', async (req, res) => {
    try {
    
      if (req.query.code) {
        const code = req.query.code;
        console.log("code trouver dans la requette")
        const tokenResponse = await exchangeGoogleCodeForToken(code);
        res.redirect(`stickersmash://?google_token=${tokenResponse}`);
      //  res.send(tokenResponse); 
      } else {
       
        const authUrl = getGoogleAuthUrl();
        res.redirect(authUrl);
      }
    } catch (error) {
      console.error('Erreur lors de l\'échange du code contre le token :', error);
      res.status(500).send('Erreur lors de l\'échange du code contre le token');
    }
  });



  app.get('/mobile-app-path', (req, res) => {
    const mail = req.query.mail;
    console.log("le mail que j'ai envoer", mail)
 
    res.redirect(`sticker://?reset_token=${mail}`);
  
  
  
  })
  app.get('/request-reset', (req, res) => {
    console.log("hello le monde")
    const encodedData = req.query.mail;
    console.log("votre mail est",encodedData)
/*
  
  const token = crypto.randomBytes(20).toString('hex');
  token[token] = encodedData;

*/

const mailOptions = {
  from: process.env.SECRET_MAIL,
  to: encodedData,
  subject: 'Réinitialisation de votre mot de passe',
  html: `<p>Cliquez sur ce lien pour réinitialiser votre mot de passe :  
         <a href="https://dd09-41-251-18-1.ngrok-free.app/mobile-app-path?mail=${encodedData}">Expense Mobile Tracker</a></p>`
};


  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
        console.log(err)
      return res.status(500).send('Erreur lors de l\'envoi de l\'email.',err);
    }
    res.sendFile(path.join(__dirname, 'Send-message.html'));
  });

  
});

  

  
  function getGoogleAuthUrl() {
    const queryParams = {
      client_id: clientid,
      redirect_uri: redirecturi,
      response_type: 'code',
      scope: 'openid email profile',
    };
  
    return `${googleAuthUrl}?${querystring.stringify(queryParams)}`;
  }

  
  async function exchangeGoogleCodeForToken(code) {
    console.log("le code est",code)
    try {
      const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: clientid,
        client_secret: clientsecret,
        redirect_uri: redirecturi,
        grant_type: 'authorization_code',
      });
  
      const accessToken = tokenResponse.data.access_token;
  
      const userDataResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (userDataResponse.status === 200) { 
        const userData = userDataResponse.data;
        console.log("la reponse est", userData);
        return accessToken;
      } else {
        console.log("échec de récupération des données !");
      }
    } catch (error) {
      console.error('Erreur lors de l\'échange du code contre le token :', error.message);
      throw error;
    }
  }
  

  app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
  });
