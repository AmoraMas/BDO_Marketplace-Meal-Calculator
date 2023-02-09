
// Find Buttons
const buttonMarketList = document.getElementById('quickMarketList');
const buttonHotList = document.getElementById('quickHotList');
const buttonWaitList = document.getElementById('quickWaitList');


// Event Listeners for buttons
buttonMarketList.addEventListener('click', defaultMarketList);
buttonHotList.addEventListener('click', defaultHotList);
buttonWaitList.addEventListener('click', defaultWaitList);


function defaultMarketList() {
    let link = `https://api.arsha.io/v1/${region}/GetWorldMarketList?mainCategory=1&subCategory=1`
    let test = $.get(link, function () {
        console.log('WorldMarketList: ', test.responseJSON.resultMsg)
    });
    //0: item id
    //1: current stock
    //2: total trades
    //3: base price
}

function defaultHotList() {
    let link = `https://api.arsha.io/v1/${region}/GetWorldMarketHotList`
    let test = $.get(link, function () {
        console.log('HotList: ', test.responseJSON.resultMsg)
    });
}

function defaultWaitList() {
    let link = `https://api.arsha.io/v1/${region}/GetWorldMarketWaitList`
    let test = $.get(link, function () {
        console.log('WaitList: ', test.responseJSON.resultMsg)
    });
}

function getItemInfo(itemID) {
    link = `https://api.arsha.io/v1/${region}/item?id=${itemID}`;


}

function getAllItems() {
    const allMeals = $.get(`https://api.arsha.io/util/db/dump?lang=${language}`, function () {
        //console.log(allItems);
        let array = [];
        for (let i = 0; i < allItems.responseJSON.length; i++) {
            let object = {};
            object['name'] = allItems.responseJSON[i].name;
            object['id'] = allItems.responseJSON[i].id;
            object['icon'] = allItems.responseJSON[i].icon;
            // console.log('Item: ', allItems.responseJSON[i].name, 'ID: ', allItems.responseJSON[i].id, 'Icon: ', allItems.responseJSON[i].icon);
            array.push(object);
        }
    });
    return allMeals;
}
