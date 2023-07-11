function menuToggle() {
    const toggleMenu = document.querySelector(".menu");
    toggleMenu.classList.toggle("active");
}

const logout_btn = document.getElementById('logout');

function logoutFunc() {
    sessionStorage.removeItem('user');
    window.location.href = './../index.html';
}

logout_btn.addEventListener('click', logoutFunc);

function setUsername() {
    document.getElementById('profile_username').innerHTML = sessionStorage.getItem('user');
}

window.addEventListener('load', setUsername);

var active = -1;

function infoToggle(id) {
    if (active == parseInt(id[1])) {
        document.getElementById(id).style.backgroundColor = "rgba(255, 255, 255, 0.3)";
        setInfo(-1);
        active = -1;
    } else {
        if (active > -1) {
            document.getElementById('f' + String(active)).style.backgroundColor = "rgba(255, 255, 255, 0.3)";
        }
        document.getElementById(id).style.backgroundColor = "rgba(255, 255, 255, 0.6)";
        setInfo(id);
        active = parseInt(id[1]);
    }
}

function setInfo(id) {
    console.log(id);
    if (active == parseInt(id[1])) {
        document.getElementById('s' + String(Math.floor(active / 3))).style.display = 'none';
    } else {
        if (active > -1) {
            document.getElementById('s' + String(Math.floor(active / 3))).style.display = 'none';
        }
        document.getElementById('s' + String(Math.floor(parseInt(id[1]) / 3))).style.display = 'flex';
    }

    if (parseInt(id[1]) == 0) {
        document.getElementById('s0text').innerHTML = `The experiment ‘REMOTE LABS: DC MOTOR’ aims to achieve remote access to a DC 
        motor through the internet, to variate its speed. The DC Motor is connected to an ESP32, which receives data for Input Voltage 
        from the internet and variates the RPM accordingly, by changing the current sent to the DC Motor. The values for RPM and Input 
        Voltage are plotted in a Voltage v/s RPM graph.`;
    } else {
        document.getElementById('s0text').innerHTML = "Experiment related information given here.";
        document.getElementById('s1text').innerHTML = "Experiment related information given here.";
    }
}

function startExp() {
    window.location.href = './../DC_Motor/dc_motor.html';
}