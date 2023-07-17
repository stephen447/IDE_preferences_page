var permissions = {} // Array for storing the teacher permissions
var student_permissions = {} // Array for storing the student permissions

// Retrieving the different elements in the HTML document
const teacher_linter_cb = document.querySelector('#teacher_linter_checkbox');
const teacher_autocomplete_cb = document.querySelector('#teacher_autocomplete_checkbox');
const student_linter_cb = document.querySelector('#student_linter_checkbox');
const student_autocomplete_cb = document.querySelector('#student_autocomplete_checkbox');
const save_button = document.querySelector('#save_btn');
// Retrieving the colour preference elements in HTML document
const teacherColourPreferences = document.getElementsByClassName("teacher_colour_column");
const studentColourPreferences = document.getElementsByClassName("student_colour_column");

// Functions for retirieving the state of checkboxes and storing in JSON file
function save_btn_event(){
    permissions["teacher_linter"]=teacher_linter_cb.checked
    permissions["teacher_autocomplete"] = teacher_autocomplete_cb.checked
    for(let i = 0; i < teacherColourPreferences.length; i++){
        Array.from(teacherColourPreferences[i].getElementsByTagName("input")).forEach(element => {
            permissions[element.id]=element.checked
        });
    }

    permissions["student_linter"]=student_linter_cb.checked
    permissions["student_autocomplete"] = student_autocomplete_cb.checked
    for(let i = 0; i < studentColourPreferences.length; i++){
        Array.from(studentColourPreferences[i].getElementsByTagName("input")).forEach(element => {
            permissions[element.id]=element.checked
        });
    }
    console.log(permissions.length)
    let blob = new Blob([JSON.stringify(permissions)], {type: 'application/json'});
    let link = document.getElementById("saveLink");
    link.download = "permissions.json";
    link.href = URL.createObjectURL(blob);
}



save_button.onclick = save_btn_event
