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
         
        console.log("Text");
        console.log(text);
    }

    }

    async function register(){

        event.preventDefault();
    
        var myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
    
        const name = $('#username').val();
        const email = $('#email').val();
        const password = $('#password').val();
        const confirmPassword = $('#confirmPassword').val();

        const data = { name, email, password, confirmPassword }
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

//Fake logout
function logout() {
    const origin = window.location.origin;
    location.assign(`${origin}/login`);
}


$('#form_log').on('keypress',function(e) {
    if(e.which == 13) {
        login();
    }
});

$('#form_reg').on('keypress',function(e) {
    if(e.which == 13) {
        register();
    }
});



