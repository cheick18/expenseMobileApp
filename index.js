const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const axios = require('axios')
const querystring = require('querystring');

const {   dbNode,addDoc,doc,collection,query,getDocs,where} = require('./firebaseConfig'); 




const app = express();
const port = 80;
app.use(cors()); 
app.use(bodyParser.json());


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

    //return 'https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=hlNe3kROVgzSkZBsPo60j7A9lfdHJGjl&scope=manage%3Ajira-project%20manage%3Ajira-configuration%20read%3Ajira-user%20write%3Ajira-work%20manage%3Ajira-webhook%20manage%3Ajira-data-provider%20read%3Ajira-work&redirect_uri=https%3A%2F%2Fexpensemobileapp-2.onrender.com%2Fsignin-jira&state=${YOUR_USER_BOUND_VALUE}&response_type=code&prompt=consent'
  
   return  `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${process.env.JIRA_ID}&scope=read%3Ame%20read%3Aaccount&redirect_uri=https%3A%2F%2Fexpensemobileapp-2.onrender.com%2Fsignin-jira&state=YOUR_USER_BOUND_VALUE&response_type=code&prompt=consent`;
    //return 'https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=oQ1Cp0ZVBnU3FizZcbJ6x3OmFfylph9G&scope=read%3Ame%20read%3Aaccount&redirect_uri=https%3A%2F%2F4037-41-141-191-127.ngrok-free.app%2Fsignin-jira&state=${YOUR_USER_BOUND_VALUE}&response_type=code&prompt=consent' 
    
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
        console.log("la reponse est", userData);
        return userData;
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
        res.redirect(`com.waga.janngamobileapp:/oauthredirect?access_token=${tokenResponse}`);
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

  app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
  });