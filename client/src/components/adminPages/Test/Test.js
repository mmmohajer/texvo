import { useState, useEffect, useRef } from "react";
import Div from "@/baseComponents/reusableComponents/Div";

import { TEST_CONSTANT_1, TEST_CONSTANT_2 } from "./constants";

const Test = () => {
  const [allSlides, setAllSlides] = useState([]);
  const [slides, setSlides] = useState([]);
  const timeoutsRef_1 = useRef([]);
  const timeoutsRef_2 = useRef([]);
  const prevSlidesRef = useRef([]);

  useEffect(() => {
    setAllSlides([...TEST_CONSTANT_1]);
    const timeoutId = setTimeout(() => {
      console.log("Adding TEST_CONSTANT_2 slides");
      setAllSlides((prev) => [...prev, ...TEST_CONSTANT_2]);
    }, 20000);
    timeoutsRef_1.current.push(timeoutId);
    return () => {
      console.log("Clearing timeouts");
      timeoutsRef_1.current.forEach(clearTimeout);
      timeoutsRef_1.current = [];
    };
  }, []);

  useEffect(() => {
    const prevItems = prevSlidesRef.current;
    const newItems = allSlides.filter((item) => !prevItems.includes(item));
    newItems?.forEach((item) => {
      const timeoutId = setTimeout(() => {
        setSlides((prev) => [...prev, item]);
      }, item?.timeToShow * 1000);
      timeoutsRef_2.current.push(timeoutId);
    });
    prevSlidesRef.current = allSlides;
    return () => {
      console.log("Clearing timeouts");
      timeoutsRef_2.current.forEach(clearTimeout);
      timeoutsRef_2.current = [];
    };
  }, [allSlides]);

  useEffect(() => {
    console.log("slides updated:", allSlides);
  }, [allSlides]);

  useEffect(() => {
    let count = 0;
    const intervalId = setInterval(() => {
      count++;
      console.log("Interval count:", count);
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <>
      <Div className="p-all-16 width-per-100">
        {slides.map((item, index) => (
          <Div key={index} className="m-b-8 bg-silver br-all-solid-2 p-all-16">
            {item.timeToShow}s: {item.text}
          </Div>
        ))}
      </Div>
    </>
  );
};

export default Test;
