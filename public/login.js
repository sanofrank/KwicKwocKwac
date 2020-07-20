async function login(){
			

    let username = $('#usernameForm').val();
    let password = $('#password').val();

    let data = {username,password};

    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        credentials: 'include'
    };
    //showSpinner();
    const response = await fetch("/api/login",requestOptions);
    const text = await response.text();

    if(!response.ok) {
        $('#errors').text(text);
    }else{
        const origin = window.location.origin;
        location.assign(`${origin}/index`);
    }

    }

    async function register(){

        event.preventDefault();
    
        var myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
    
        const name = $('#username').val();
        const email = $('#email').val();
        const password = $('#password').val();
    
        const data = { name, email, password }
        //var raw = "{	\n	\"name\" : \"prova\"\n	\"email\": \"prova@gmail.com\",\n	\"password\": \"prova\"\n}";
    
        const requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: JSON.stringify(data)
        };
    
        const response = await fetch("/api/register",requestOptions);
        const text = await response.text();
        if(!response.ok) $('#errors').text(text);
        else{
            const origin = window.location.origin;
            location.assign(`${origin}/login`);
        //document.getElementsByTagName('h1').innerHTML = `Benvenuto ${text}`
    }
}



