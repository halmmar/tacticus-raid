// Authentication functions

async function setAPIToken(event) {
    event.preventDefault();
    const userId = document.getElementById("user-id").value;
    const apiKey = document.getElementById("api-key").value;
    let result = await fetch("login.py", {
        method: "GET",
        headers: {
            "X-USER-ID": userId,
            "X-API-KEY": apiKey
        }
    }).then(response => {
        console.log(response);
        if (!response.ok) {
            return {"Failed": response.status};
        } else {
            localStorage.setItem("user-id", userId);
            localStorage.setItem("api-key", apiKey);
            return response.json();
        }
    });
    if (result.userName) {
        localStorage.setItem("user-name", userName = result.userName);
        localStorage.setItem("user-guild-role", userGuildRole = result.role);
        document.getElementById("api-response").innerHTML = `Logged in as ${userName}. Refresh the page to access the database.`;
        window.location.reload();
    } else {
        document.getElementById("api-response").innerHTML = JSON.stringify(result);
    }
}

function removeOfficerRights(event) {
    console.log("???");
    event.preventDefault();
    localStorage.setItem("user-guild-role", userGuildRole = "MEMBER");
    window.location.reload();
}
