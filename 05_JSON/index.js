
let userObj =
{
    username: "gshor",
    grade: 85,
    password: "pass123",
    isConnected: true,
    address: {
        country: "israel",
        city: "KASH",
        street: "ben guriuon 10"
    },
    allgrades: [{ csharp: 90 }, { cpp: 70 }, 90, 100, 85]
}

let newGrade = userObj.grade + 10;
userObj.grade += 10;
userObj.id = 1000;

let userObj2 = userObj;
userObj.grade += 10;
userObj2.grade = 0;
let grade1 = userObj.grade;


userObj.address.street = "";
userObj["address"].city = "telaviv";


let arr = [userObj, {
    username: "gshor",
    grade: 85,
    password: "pass123",
    isConnected: true,
    address: {
        country: "israel",
        city: "KASH",
        street: "ben guriuon 10"
    },
    allgrades: [{ csharp: 90 }, { cpp: 70 }, 90, 100, 85]
}
]

arr[0].allgrades[1] = { CPP: 80 };
arr[1].avg = 95;

let user2 = arr[1];
user2.password = "12345";


