const init = async () => {

    const data = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    console.log(data);

    const newData = data.splice(0, 50);

    console.log('newData: ', newData);

}

init();