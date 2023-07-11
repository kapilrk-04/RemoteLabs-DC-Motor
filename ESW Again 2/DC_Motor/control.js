if (!sessionStorage.voltage_val) {
    sessionStorage.voltage_val = 0;
}

if (!sessionStorage.upload_counter) {
    sessionStorage.upload_counter = 0;
}

if (!sessionStorage.point_count) {
    sessionStorage.point_count = 0;
}

if (!sessionStorage.temp_voltage) {
    sessionStorage.temp_voltage = 1000;
}

if (!sessionStorage.graph_data) {
    sessionStorage.setItem("data", JSON.stringify([]));
}

function menuToggle() {
    const toggleMenu = document.querySelector(".menu");
    toggleMenu.classList.toggle("active");
}

const logout_btn = document.getElementById('logout');

function logoutFunc() {
    sessionStorage.clear();
    window.location.href = './../index.html';
}

logout_btn.addEventListener('click', logoutFunc);

function setUsername() {
    document.getElementById('profile_username').innerHTML = sessionStorage.getItem('user');
}

window.addEventListener('load', setUsername);

var rangeSlider = document.getElementById("sliderV");
var rangeBullet = document.getElementById("voltage");

function showSliderValue() {
    rangeBullet.innerHTML = rangeSlider.value / 10;
    console.log(rangeSlider.value);
    console.log(rangeBullet.innerHTML);
    var bulletPosition = (rangeSlider.value / rangeSlider.max);
    rangeBullet.style.left = (bulletPosition * 57.2) + "vh";
}

function updateVoltageVisual(val) {
    document.getElementById("voltage").innerHTML = val;
}

function updateVoltage(val) {
    sessionStorage.voltage_val = val / 10;
}

function updateVoltageTS(val) {
    const xhr_volt = new XMLHttpRequest();
    xhr_volt.open('GET', 'https://api.thingspeak.com/update?api_key=7LE70TACXFMTWDES&field1=' + String(val));
    xhr_volt.send();
    sessionStorage.voltage_val_ts = val;
    sessionStorage.upload_counter = 0;
}

function voltageHandler() {
    if (sessionStorage.upload_counter != 0) {
        sessionStorage.upload_counter -= 1;
    } else {
        if (sessionStorage.voltage_val_ts == sessionStorage.voltage_val) {
            // value not to be updated
        } else {
            updateVoltageTS(sessionStorage.voltage_val);
        }
    }
}

window.setInterval(voltageHandler, 1000);

const session_total_time = 1000 * 60 * 15;

if (!sessionStorage.session_time) {
    session_timer();
}

function session_timer() {
    sessionStorage.session_time = +new Date + session_total_time;
}

function setTimeInit() {
    var init_min = String(Math.floor(session_total_time / (1000 * 60)));
    if (init_min.length == 1) {
        init_min = "0" + init_min;
    }

    var init_sec = String(Math.floor((session_total_time % (1000 * 60)) / 1000));
    if (init_sec.length == 1) {
        init_min = "0" + init_sec;
    }

    document.getElementById("timerval").innerHTML = init_min + ":" + init_sec;
}

function timer_handler() {
    var session_time_left = sessionStorage.session_time - new Date;

    if (session_time_left >= 0) {
        var time_min = String(Math.floor(session_time_left / (1000 * 60)));
        var time_sec = String(Math.floor((session_time_left % (1000 * 60)) / 1000));
        if (time_min.length == 1) {
            time_min = "0" + time_min;
        }
        if (time_sec.length == 1) {
            time_sec = "0" + time_sec;
        }
        var time_text = time_min + ":" + time_sec;
        document.getElementById("timerval").innerHTML = time_text;
    } else {
        exit_session();
    }
}

function exit_session() {
    clearInterval(id);
    console.log("exit");
    var user = document.getElementById("profile_username").innerHTML;
    sessionStorage.clear();
    sessionStorage.setItem('user', user);
    window.location.href = "./../Experiments/expIndex.html";
    alert("Maximum session time reached. Exited automatically.");
}

var id = setInterval(timer_handler, 100);

window.onload = function() {
    updateVoltageVisual(sessionStorage.voltage_val);
    document.getElementById("sliderV").value = sessionStorage.voltage_val * 10;
    showSliderValue();
    if (!sessionStorage.voltage_val_ts) {
        updateVoltageTS(sessionStorage.voltage_val);
    }
    if (!sessionStorage.session_time) {
        setTimeInit();
    }
}

function leavePage() {
    var user = document.getElementById("profile_username").innerHTML;
    sessionStorage.clear();
    sessionStorage.setItem('user', user);
    window.location.href = "./../Experiments/expIndex.html";
}

function updateRPM() {
    const xhr_rpm = new XMLHttpRequest();
    xhr_rpm.open('GET', 'https://api.thingspeak.com/channels/1922369/feeds.json?api_key=X6AIB4BT742F561D&results=1');
    xhr_rpm.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var curr_rpm = JSON.parse(this.responseText);
            consolePrint(curr_rpm);
        }
    }
    xhr_rpm.send();
}

setInterval(updateRPM, 500);

function consolePrint(jsonval) {
    if (jsonval["feeds"][0]["field2"] && String(jsonval["feeds"][0]["field2"]) != String(document.getElementById("rpm").innerHTML)) {
        document.getElementById("rpm").innerHTML = jsonval["feeds"][0]["field2"];
    }
}

function graphDataUpdate() {
    if (sessionStorage.temp_voltage != sessionStorage.voltage_val_ts) {
        sessionStorage.temp_voltage = sessionStorage.voltage_val_ts;
        var json = JSON.parse(sessionStorage.getItem("data"));
        var volt = sessionStorage.temp_voltage;
        var new_entry = {};
        new_entry[String(volt)] = String(document.getElementById("rpm").innerHTML);
        var json1 = json.concat([new_entry]);
        sessionStorage.setItem("data", JSON.stringify(json1));
    } else {
        var json = JSON.parse(sessionStorage.getItem("data"));
        var volt = sessionStorage.temp_voltage;
        if (json.length >= 1) {
            json[json.length - 1][String(volt)] = String(document.getElementById("rpm").innerHTML);
            sessionStorage.setItem("data", JSON.stringify(json));
        }
    }
}

setInterval(graphDataUpdate, 500);

function drawGraph() {
    var json = JSON.parse(sessionStorage.getItem("data"));
    var values = [];
    for (var i = 0; i < json.length; i++) {
        values = values.concat([{ x: parseFloat(Object.keys(json[i])[0]), y: parseInt(Object.values(json[i])[0]) }]);
    }
    console.log(JSON.stringify(values));
    new Chart("myChart", {
        type: "scatter",
        data: {
            datasets: [{
                pointRadius: 4,
                pointBackgroundColor: "rgb(0,0,255)",
                data: values,
            }]
        },
        options: {
            legend: { display: false },
            scales: {
                xAxes: [{ ticks: { min: 0, max: 10 } }],
                yAxes: [{ ticks: { min: 0, max: 800 } }],
                y: {
                    border: {
                        display: true
                    },
                    grid: {
                        display: true,
                        color: 'white',
                    }
                },
                x: {
                    grid: {
                        color: 'white'
                    }
                }
            },
            animation: {
                duration: 0
            }
        }
    });
}

setInterval(drawGraph, 1000);

var t_val = 0;
var i_val = 0;

function theoryDisplay() {
    if (t_val == 0) {
        if (i_val == 1) {
            i_val = 0;
            document.getElementById('i').style.display = 'none';
        }
        document.getElementById('t').style.display = 'block';
        t_val = 1;
    } else {
        document.getElementById('t').style.display = 'none';
        t_val = 0
    }
}

function instDisplay() {
    if (i_val == 0) {
        if (t_val == 1) {
            t_val = 0;
            document.getElementById('t').style.display = 'none';
        }
        document.getElementById('i').style.display = 'block';
        i_val = 1;
    } else {
        document.getElementById('i').style.display = 'none';
        i_val = 0
    }
}