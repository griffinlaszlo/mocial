
// Function to close the popup
function closePopup() {
    document.getElementById("popup").style.display = "none";
}

// Function to open the popup
function openPopup() {
    document.getElementById("popup").style.display = "block";
}

// Open the popup automatically after 3 seconds (3000 milliseconds)
window.onload = function() {
    setTimeout(function() {
        openPopup();
    }, 3000);
};

// Function to position the popup randomly
function positionPopupRandomly() {
    const popup = document.getElementById("popup-content");
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popupWidth = popup.offsetWidth;
    const popupHeight = popup.offsetHeight;

    // Ensuring the popup stays within the horizontal bounds of the viewport
    const maxX = viewportWidth - popupWidth;
    const randomX = Math.random() * maxX;

    // Ensuring the popup stays within the vertical bounds of the viewport
    const maxY = viewportHeight - popupHeight;
    const randomY = Math.random() * maxY;

    // Apply the random position
    popup.style.left = randomX + 'px';
    popup.style.top = randomY + 'px';
}


function makePopupDraggable() {
    const popup = document.getElementById("popup-content");
    let isDragging = false;
    let dragStartX, dragStartY;


    function onMouseMove(e) {
        if (!isDragging) return;

        let newX = popup.offsetLeft + (e.clientX - dragStartX);
        let newY = popup.offsetTop + (e.clientY - dragStartY);

        popup.style.left = newX + 'px';
        popup.style.top = newY + 'px';

        dragStartX = e.clientX;
        dragStartY = e.clientY;
    }

    function onMouseUp() {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }

    popup.addEventListener('dragstart', function(e) {
        e.preventDefault(); // Prevent default drag behavior
    });
}

// Open the popup and make it draggable
window.onload = function() {
    setTimeout(function() {
        openPopup();
        positionPopupRandomly();
        makePopupDraggable();
    }, 3000);
};



$(document).ready(function() {
    $("#canary-yellow-wrapper").draggable();
});
$(document).ready(function() {
    $("#postmodern-wrapper").draggable();
});



function makeElementDraggable(elementId) {
    var element = document.getElementById(elementId);
    var posX = 0, posY = 0, offsetX = 0, offsetY = 0;

    element.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e.preventDefault();
        offsetX = e.clientX;
        offsetY = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
        // Optional: Change cursor during drag
        element.style.cursor = 'default';
    }

    function elementDrag(e) {
        e.preventDefault();
        posX = offsetX - e.clientX;
        posY = offsetY - e.clientY;
        offsetX = e.clientX;
        offsetY = e.clientY;
        element.style.top = (element.offsetTop - posY) + "px";
        element.style.left = (element.offsetLeft - posX) + "px";
    }

    function closeDragElement() {
        // Restore cursor after dragging
        element.style.cursor = 'default';
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

// Initialize the draggable function
makeElementDraggable("computer-icon");
makeElementDraggable("folder-icon");
makeElementDraggable("google-icon");


// typing effect

function typeWriter(text, elementId, speed, callback) {
    let i = 0;
    const output = document.getElementById(elementId);

    function typing() {
        if (i < text.length) {
            let char = text[i];
            output.innerHTML += char;
            i++;
            setTimeout(typing, speed);
        } else if (callback) {
            callback(); // Execute the callback function after finishing typing
        }
    }
    typing();
}

"I was born in London on July 1st, 2002. "


const title = "mocial"
//const aboutMeH = "You've come to the right place."
// const aboutMeText = "ah blah blah bla.";
const projectsH = "Projects"
const projectsText = "My professional journey is marked by a series of exciting projects that showcase my expertise in social media and content creation. Notably, as a founding member of Chipotle's inaugural Creator Class, I played a pivotal role in shaping the brand's future through exclusive partnerships and content creation. My work with Snap Inc. involved advising on UX and UI improvements, significantly impacting how creators engage with the platform. One of my unique projects was the development of a fully automated Twitter bot, a venture that deepened my understanding of web development and the integration of social media with advanced programming concepts. Additionally, my role as the Head of Content at YOKE saw me managing content across various social media platforms, connecting with brands, and strategizing on content development. My freelance work as a Video Editor for RapTV further allowed me to hone my skills in trend identification and accessible content creation. These sections provide a succinct yet comprehensive overview of your professional background and highlight your key skills and experiences.";

typeWriter(title, 'title', 40, function() {
    typeWriter(aboutMeH, 'aboutMeH', 1, function() {
        typeWriter(aboutMeText, 'about-me',1, function() {
            typeWriter(projectsH, 'projectsH', 100, function() {
                typeWriter(projectsText, 'projects-by-me', 5); // No callback needed for the last call
            });
        });
    });
});
