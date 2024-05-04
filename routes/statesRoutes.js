const express = require('express');
const router = express.Router();
const statesController = require('../controllers/statesController');


router.get('/', statesController.getAllStates);


router.route('/:stateCode/funfact')
    .all(statesController.verifyStates)
    .get(statesController.getFunFact)
    .post(statesController.createNewFunFact)
    .patch(statesController.updateFunFact)
    .delete(statesController.deleteFunFact);

router.get('/:stateCode/capital', 
    statesController.verifyStates,
    statesController.getStateCapital);


router.get('/:stateCode/nickname', 
    statesController.verifyStates,
    statesController.getStateNickname);


router.get('/:stateCode/population',
    statesController.verifyStates, 
    statesController.getStatePopulation);


router.get('/:stateCode/admission',
    statesController.verifyStates,
    statesController.getStateAdmission);


router.route('/:stateCode')
    .all(statesController.verifyStates)
    .get(statesController.getState);

module.exports = router;