const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const {   dbNode,addDoc,doc,collection} = require('./firebaseConfig'); 


const app = express();
const port = 80;
app.use(cors()); 
app.use(bodyParser.json());
app.post('/AddData', async (req, res) => {
    try {
       

        
      const { url, hook} = req.body; 
     
const saveUrl= await addDoc(collection(dbNode, "MappingTable"), {
    url,
    hook,
    timestamp: new Date()

});
      
      
  
res.status(201).send('Données ajoutées avec succès');
    
    
    } catch (error) {
      console.error('Erreur lors de l\'ajout des données :', error);
      res.status(500).send('Erreur lors de l\'ajout des données');
    }
  });

  app.get('/', (req, res) => {
    res.send({'test':'Bienvenue sur mon serveur Express'});
  });
  
  
  // Démarrer le serveur
  app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
  });