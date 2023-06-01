function Validator(options) {

    function getParent(element, selector) {
        while (element.parentElement) {
            if (element.parentElement.matches(selector)) { // Dùng `matches` để kiểm tra khi gọi thẻ cha của `element` có trùng vs `selector` k
                return element.parentElement;
            }
            element = element   .parentElement; // Gán r dùng vòng `while` lặp vô hạn để tìm cho đến  cha cần tìm
        }
    }

    var selectorRules = {};

    // Hàm thực hiện validate
    function Validate(inputElement, rule) {
        var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector); //từ thẻ `input` dùng `parentElement` lấy ra thẻ cha là `form-group` rồi chọc ngược lại thẻ `span` con
        var errorMessage = rule.test(inputElement.value);   // giá trị khi nhập vào ô input

        // Lấy ra các rules trong selector
        var rules = selectorRules[rule.selector];

        // Lặp qua các rule và kiểm tra
        // Nếu có lỗi thì dừng việc kiểm tra
        for (var i = 0; i < rules.length; ++i) {
            switch(inputElement.type) { 
                case 'radio':
                case 'checkbox':
                    errorMessage = rules[i](
                        formElement.querySelector(rule.selector + ':checked')
                    );
                    break;
                default:
                    errorMessage = rules[i](inputElement.value)
            }
            if (errorMessage) break;
        }
        // console.log(!errorMessage)



        if (errorMessage) {
            errorElement.innerText = errorMessage;
            getParent(inputElement, options.formGroupSelector).classList.add('invalid');
        } else {
            errorElement.innerText = '';
            getParent(inputElement, options.formGroupSelector).classList.remove('invalid');
        }
        // console.log(!errorMessage)
        return !errorMessage
    }

    // Lấy element của form cần valudate
    var formElement = document.querySelector(options.form);     // options.form = #form-1
    if (formElement) {
        // khi submit form
        formElement.onsubmit = function (e) {
            e.preventDefault();

            var isFormValid = true;

            // Lặp qua từng rules và validate
            options.rules.forEach(function (rule) {
                var inputElement = formElement.querySelector(rule.selector);
                var isValid = Validate(inputElement, rule);     // hàm validate trả về false nếu k nhập và true nếu nhập
                if (!isValid) {  // Nếu hàm trả về false thì isFormValid sẽ false
                    isFormValid = false;
                }
            });


            if (isFormValid) {      // isFormValid true 
                // Trường hơp submit vs JS
                if( typeof options.onSubmit === 'function') { // Nếu onSubmit bên validator là 1 function
                    var enableInputs = formElement.querySelectorAll('[name]') // Lấy toàn bộ phần tử có 'name'
                    var formValues = Array.from(enableInputs).reduce(function(values, input) {
                        // console.log(input.value)
                        switch(input.type) {
                            case 'radio':
                                values[input.name] = formElement.querySelector('input[name ="' + input.name + '"]:checked').value;
                                break;
                            case 'checkbox':
                                if(!input.matches(':checked')) {
                                    values[input.name] = '';
                                    return values;
                                }
                                if (!Array.isArray(values[input.name])) {
                                    
                                    values[input.name] = [];
                                } 
                                values[input.name].push(input.value);
                                break;
                            case 'file':
                                values[input.name] = input.files;
                                break;
                            default:
                                values[input.name] = input.value
                        }
                        return values; 
                    }, {});
                    // console.log(formValues)
                    options.onSubmit(formValues);
                }
                // Trường hơp submit vs hành vi mặc định
                else { 
                    formElement.submit();
                }
            }
        }

        // Lặp qua mỗi rule và xử lý ( lắng nghe sự kiện blur, input, ...)
        options.rules.forEach(function (rule) {

            // Lưu lại các rules cho mỗi input
            if (Array.isArray(selectorRules[rule.selector])) {
                selectorRules[rule.selector].push(rule.test);     // Dùng push để đẩy những rules có selector trùng vs cái bên dưới lên lại
            } else {
                selectorRules[rule.selector] = [rule.test];     // Nếu kp arr thì gán vào 1 mảng có phần từ đầu tiên là rule
            }

            var inputElements = formElement.querySelectorAll(rule.selector); //inputElement là thẻ input
            Array.from(inputElements).forEach(function (inputElement) {
                // Xử lý trường hợp blur khỏi input

                inputElement.onblur = function () {
                    Validate(inputElement, rule)
                }

                // Xử lý mỗi khi người dùng nhập vào input
                inputElement.oninput = function () {
                    var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector); //từ thẻ `input` dùng `parentElement` lấy ra thẻ cha là `form-group` rồi chọc ngược lại thẻ `span` con
                    errorElement.innerText = '';
                    getParent(inputElement, options.formGroupSelector).classList.remove('invalid');
                }
            });
        });
    }
}

// Định nghĩa các rules
// Nguyên tăc của các rules:
// 1. Khi có lỗi => trả message lỗi
// 2. Khi ko có lỗi => ko trả gì cả


Validator.isRequired = function (selector, message) {
    return {
        selector: selector,             // Seletor: là #fullname
        test: function (value) {
            return value ? undefined : message || 'Vui lòng nhập trường này' // Loại bỏ khoảng trắng trong trường hợp này là dấu cách
        }
    };
}

Validator.isEmail = function (selector, message) {
    return {
        selector: selector,
        test: function (value) {
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value) ? undefined : message || 'Vui lòng nhập đúng định dạng email' // Phương thức test được sử dụng để kiểm tra xem chuỗi value có khớp
        }
    };
}

Validator.minLength = function (selector, min, message) {
    return {
        selector: selector,
        test: function (value) {
            return value.length >= min ? undefined : message || `Vui lòng nhập tối thiểu ${min} ký tự `
        }
    };
}

Validator.isConfirmed = function (selector, getConfirmValue, message) {
    return {
        selector: selector,
        test: function (value) {
            return value === getConfirmValue() ? undefined : message || 'Giá trị nhập vào không chính xác' // Dùng `message || 'Giá trị nhập vào không chính xác'` Nghĩa là nếu có message thì lấy gtri message còn k thì lấy gtrị sau
        },
    };
}