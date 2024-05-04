const fs = require('fs').promises;
const path = require('path');
const State = require('../models/State');
const statesData = require('../statesData.json');


const verifyStates = (req, res, next) => {

    const stateCode = req.params.stateCode.toUpperCase();
    const stateCodes = statesData.map(state => state.code);


    if (!stateCodes.includes(stateCode)) {
        return res.status(400).json({ 'message': 'No states found' });
    }


    req.stateCode = stateCode;
    next();
};


const getAllStates = async (req, res) => {
    try {

        const data = await fs.readFile(path.join(__dirname, '..', 'statesData.json'), 'utf8');
        const states = JSON.parse(data);


        if (req.query.contig !== undefined) {

            const nonContiguousStates = ['AK', 'HI'];


            const contig = req.query.contig.toLowerCase() === 'true';


            const filteredStates = states.filter(state => {
                const isContiguous = !nonContiguousStates.includes(state.code);
                return isContiguous === contig;
            });


            const funFactsPromises = filteredStates.map(state => getStateFunFacts(state.code));
            const allFunFacts = await Promise.all(funFactsPromises);


            filteredStates.forEach((state, index) => {
                if (allFunFacts[index]) {
                    state.funfacts = allFunFacts[index];
                }
            });

            return res.json(filteredStates);
        }
        else {

            const funFactsPromises = states.map(state => getStateFunFacts(state.code));
            const allFunFacts = await Promise.all(funFactsPromises);


            states.forEach((state, index) => {
                if (allFunFacts[index]) {
                    state.funfacts = allFunFacts[index];
                }
            });
            
            return res.json(states);
        }
    } 
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};


const getState = async (req, res) => {
    try {

        const state = await getStateData(req.stateCode);
        const funfacts = await getStateFunFacts(req.stateCode);
            

        if (funfacts) {
            state.funfacts = funfacts;
        }
        res.json(state);
    }
    catch(err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};


const getStateData = async (stateCode) => {

    const data = await fs.readFile(path.join(__dirname, '..', 'statesData.json'), 'utf8');
    const states = JSON.parse(data);


    const state = states.find(state => state.code === stateCode.toUpperCase());
    return state || null;
};


const getStateCapital = async (req, res) => {

    const state = await getStateData(req.stateCode);
    res.json({ "state": state.state, "capital": state.capital_city });
};


const getStateNickname = async (req, res) => {

    const state = await getStateData(req.stateCode);
    res.json({ "state": state.state, "nickname": state.nickname });
};


const getStatePopulation = async (req, res) => {

    const state = await getStateData(req.stateCode);


    const formattedPopulation = state.population.toLocaleString('en-US');
    res.json({ "state": state.state, "population": formattedPopulation });
};


const getStateAdmission = async (req, res) => {

    const state = await getStateData(req.stateCode);
    res.json({ "state": state.state, "admitted": state.admission_date });
};


const getStateFunFacts = async (stateCode) => {
    const state = await State.findOne({ stateCode: stateCode.toUpperCase() });
    return state ? state.funfacts : null;
};


const getFunFact = async (req, res) => {
    try {

        const funfacts = await getStateFunFacts(req.stateCode);
        const state = await getStateData(req.stateCode);
    

        if (!funfacts || funfacts.length === 0) {
            return res.status(404).json({ 'message': `No Fun Facts found for ${state.state}` });
        }
    

        const randomIndex = Math.floor(Math.random() * funfacts.length);
        const funfact = funfacts[randomIndex];
    
        res.json({ funfact });
    }
    catch(err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};


const createNewFunFact = async (req, res) => {
   
    const funfact = req.body.funfacts;
    const stateCode = req.stateCode;

   
    if (!funfact || funfact.length === 0) {
        return res.status(400).json({ 'message': 'State fun facts required' });
    }

    
    if (!Array.isArray(funfact)) {
        return res.status(400).json({ 'message': 'State fun facts value must be an array' });
    }

    try {
       
        const updatedState = await State.findOneAndUpdate(
            { stateCode }, 
            { $push: { funfacts: { $each: funfact } } },
            { new: true, upsert: true }
        );

        
        if (!updatedState) {
            return res.status(404).json({ 'message': 'State not found' });
        }

        res.status(200).json(updatedState);
    } 
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};


const updateFunFact = async (req, res) => {

    const newFunFact = req.body.funfact;
    let index = req.body.index;
    const stateCode = req.stateCode;


    if (!index) {
        return res.status(400).json({ 'message': 'State fun fact index value required' });
    }


    if (!newFunFact) {
        return res.status(400).json({ 'message': 'State fun fact value required' });
    }

    try {
        
        index = index - 1;

        const stateFunFacts = await getStateFunFacts(stateCode);
        const stateData = await getStateData(stateCode);


        if (!stateFunFacts || stateFunFacts.length === 0) {
            return res.status(404).json({ 'message': `No Fun Facts found for ${stateData.state}` });
        }


        if (index < 0 || index >= stateFunFacts.length) {
            return res.status(404).json({ 'message': `No Fun Fact found at that index for ${stateData.state}` });
        }


        const state = await State.findOneAndUpdate(
            { stateCode: stateCode },
            { $set: { [`funfacts.${index}`]: newFunFact } },
            { new: true }
        );

        return res.status(200).json(state);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};


const deleteFunFact = async (req, res) => {

    let index = req.body.index;
    const stateCode = req.stateCode;


    if (!index) {
        return res.status(400).json({ 'message': 'State fun fact index value required' });
    }

    try {

        index = index - 1;

        const stateFunFacts = await getStateFunFacts(stateCode);
        const stateData = await getStateData(stateCode);


        if (!stateFunFacts || stateFunFacts.length === 0) {
            return res.status(404).json({ 'message': `No Fun Facts found for ${stateData.state}` });
        }


        if (index < 0 || index >= stateFunFacts.length) {
            return res.status(404).json({ 'message': `No Fun Fact found at that index for ${stateData.state}` });
        }


        await State.findOneAndUpdate(
            { stateCode: stateCode },
            { $unset: { [`funfacts.${index}`]: 1 } }
        );
        

        const state = await State.findOneAndUpdate(
            { stateCode: stateCode },
            { $pull: { funfacts: null } },
            { new: true }
        );

        return res.status(200).json(state);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    verifyStates,
    getAllStates,
    getState,
    getFunFact,
    createNewFunFact,
    getStatePopulation,
    getStateAdmission,
    getStateNickname,
    getStateCapital,
    updateFunFact,
    deleteFunFact
};