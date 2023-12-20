

const Spinner = () => {

    return (
        <div className=" w-11/12 flex justify-center mt-20">
        <svg className="h-14 w-14 animate-spin" fill="rgba(191, 73, 103, 1)" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 1.25c-0.414 0-0.75 0.336-0.75 0.75s0.336 0.75 0.75 0.75v0c7.318 0.001 13.25 5.933 13.25 13.251 0 3.659-1.483 6.972-3.881 9.37v0c-0.14 0.136-0.227 0.327-0.227 0.537 0 0.414 0.336 0.75 0.75 0.75 0.212 0 0.403-0.088 0.539-0.228l0-0c2.668-2.669 4.318-6.356 4.318-10.428 0-8.146-6.604-15.751-15.75-15.751h-0z"></path>
        </svg>
      </div>
    )

};

export default Spinner;