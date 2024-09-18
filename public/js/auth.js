/*!
 * Kwic Kwoc Kwac - authentication auth.js 
 * Version 1.9 - 18/09/2024
 * Ideation and first prototype: Fabio Vitali, ©2020
 * Authors: Fabio Vitali, Francesco Paolucci, Sebastian Barzaghi September 2024
 * License: https://github.com/sanofrank/KwicKwocKwac/blob/master/LICENSE.md (MIT)
  
   Rules to edit this file: 
   * Change and modify and reshuffle and refactor and throw away as you see fit. 
   * Never remove this comment
   * Never change the line "Ideation and first prototype"
   * If you fixed some bugs or did some minor refactoring, ADD a new line "Contributor" with your name and date. 
   * If you did some major reshuffling or refactoring, ADD your name to the authors' list. 
   * Switching to ES2015 is NOT major refactoring.
   * If my code has basically disappeared, remove my name from the authors' list. 
   * Do NOT inform me of this. 
 */

//Change password
async function change_password(){
    event.preventDefault();

    let new_pass = $('#new-password').val();
    let confirm_pass = $('#confirm-password').val();

    let data = {new_pass,confirm_pass};

    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }

    const response = await fetch('api/change_password',requestOptions);
    const text = await response.text();
    var msg = $('#msg-change');

    if(!response.ok){
        msg.css('display','block');
        msg.addClass('alert-danger').removeClass('alert-success');
        msg.text(text);
    }else{
        msg.css('display','block');
        msg.addClass('alert-success').removeClass('alert-danger');
        
        let redirect = `
               Password cambiata correttamente. Clicca <a href='#' onclick = 'logout()'>qui</a> per eseguire di nuovo l'accesso o attendi {$counter} secondi.
        `
        var timer = {
            counter : 5
        }

        var new_string = redirect.tpl(timer)
        msg.html(new_string);

        setInterval(() => {
            timer.counter = timer.counter - 1;
        
            new_string = redirect.tpl(timer);
            msg.html(new_string);
            
            if (timer.counter == 0) {
                logout();
            }
        }, 1000);

    }
}

async function login(){

    //clean errors
    $('#errors').text('')

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
    const response = await fetch("/markup/api/login",requestOptions);
    const text = await response.text();

    if(!response.ok) {
        $('#errors').text(text);
    }else{
        const origin = window.location.origin;
        location.assign(`${origin}/markup/index`);
         
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
    
        const response = await fetch("/markup/api/register",requestOptions);
        const text = await response.text();
        if(!response.ok) $('#errors').text(text);
        else{
            const origin = window.location.origin;
            location.assign(`${origin}/login`);
        //document.getElementsByTagName('h1').innerHTML = `Benvenuto ${text}`
    }
}

//"Fake" logout
async function logout() {
    const origin = window.location.origin;

    const token = await fetch('/markup/api/logout')
    if(token){
        location.assign(`${origin}/markup/login`);
    }
}

function show_hide(x){
    let field = x.parentNode.parentNode.id;

    event.preventDefault();
    if($(`#${field} input`).attr("type") == "text"){
        $(`#${field} input`).attr('type', 'password');
        $(`#${field} i`).addClass( "fa-eye-slash" );
        $(`#${field} i`).removeClass( "fa-eye" );
    }else if($(`#${field} input`).attr("type") == "password"){
        $(`#${field} input`).attr('type', 'text');
        $(`#${field} i`).removeClass( "fa-eye-slash" );
        $(`#${field} i`).addClass( "fa-eye" );
    }
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



