var teacher_permissions = {} // Array for storing the teacher permissions
var student_permissions = {} // Array for storing the student permissions

// Retrieving the different elements in the HTML document
const teacher_linter_cb = document.querySelector('#teacher_linter_checkbox');
const teacher_autocomplete_cb = document.querySelector('#teacher_autocomplete_checkbox');
const teacher_save_btn = document.querySelector('#teacher_save_btn');
const student_linter_cb = document.querySelector('#student_linter_checkbox');
const student_autocomplete_cb = document.querySelector('#student_autocomplete_checkbox');
const student_save_button = document.querySelector('#student_save_btn');
// Retrieving the colour preference elements in HTML document
const teacherColourPreferences = document.getElementsByClassName("teacher_colour_column");
const studentColourPreferences = document.getElementsByClassName("student_colour_column");

// Functions for retirieving the state of checkboxes and storing in JSON file
function teacher_save_btn_event(){
    teacher_permissions["teacher_linter"]=teacher_linter_cb.checked
    teacher_permissions["teacher_autocomplete"] = teacher_autocomplete_cb.checked
    for(let i = 0; i < teacherColourPreferences.length; i++){
        Array.from(teacherColourPreferences[i].getElementsByTagName("input")).forEach(element => {
            teacher_permissions[element.id]=element.checked
        });
    }
    
    let blob = new Blob([JSON.stringify(teacher_permissions)], {type: 'application/json'});
    let link = document.getElementById("teacherSaveLink");
    link.download = "teacher_permissions.json";
    link.href = URL.createObjectURL(blob);
}

function student_save_btn_event(){
    student_permissions["student_linter"]=student_linter_cb.checked
    student_permissions["student_autocomplete"] = student_autocomplete_cb.checked
    for(let i = 0; i < studentColourPreferences.length; i++){
        Array.from(studentColourPreferences[i].getElementsByTagName("input")).forEach(element => {
            student_permissions[element.id]=element.checked
        });
    }
    
    let blob = new Blob([JSON.stringify(student_permissions)], {type: 'application/json'});
    let link = document.getElementById("studentSaveLink");
    link.download = "student_permissions.json";
    link.href = URL.createObjectURL(blob);
}

teacher_save_btn.onclick = teacher_save_btn_event
student_save_btn.onclick = student_save_btn_event
