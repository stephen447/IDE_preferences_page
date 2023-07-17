var permissions = {} // Array for storing the teacher permissions
var student_permissions = {} // Array for storing the student permissions

// Retrieving the elements for general and colour permissions in HTML document
const teacherGeneralPermissions = document.getElementsByClassName("teacher_general_permissions");
const studentGeneralPermissions = document.getElementsByClassName("student_general_permissions");
const teacherColourPermissions = document.getElementsByClassName("teacher_colour_column");
const studentColourPermissions = document.getElementsByClassName("student_colour_column");


function save_btn_event(){
    /**
     * Function for retirieving the state of form inputs and storing&saving in JSON file
     */
    
    // Teacher permissions
    Array.from(teacherGeneralPermissions[0].getElementsByTagName("input")).forEach(element => {
        permissions[element.id]=element.checked
    });
    for(let i = 0; i < teacherColourPermissions.length; i++){
        Array.from(teacherColourPermissions[i].getElementsByTagName("input")).forEach(element => {
            permissions[element.id]=element.checked
        });
    }

    // Student permissions
    Array.from(studentGeneralPermissions[0].getElementsByTagName("input")).forEach(element => {
        permissions[element.id]=element.checked
    });
    for(let i = 0; i < studentColourPermissions.length; i++){
        Array.from(studentColourPermissions[i].getElementsByTagName("input")).forEach(element => {
            permissions[element.id]=element.checked
        });
    }

    // Converting array to JSON and saving the JSON
    let blob = new Blob([JSON.stringify(permissions)], {type: 'application/json'});
    let link = document.getElementById("saveLink");
    link.download = "permissions.json";
    link.href = URL.createObjectURL(blob);
}

save_button.onclick = save_btn_event //Event handler for save button
